import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { BookingStatus, NewBooking, TimePeriod } from '../../../contracts/booking.js'
import {
  type AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../src/errors/appErrors.js'
import {
  createBookingsRepository,
  type BookingsRepository,
} from '../../src/repositories/bookingsRepository.js'
import { createRoomsRepository } from '../../src/repositories/roomsRepository.js'
import { createSeatsRepository } from '../../src/repositories/seatsRepository.js'
import {
  createBookingsService,
  type BookingActor,
  type BookingsService,
} from '../../src/services/bookingsService.js'
import { addDays } from '../../src/services/common.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const TODAY = '2030-01-02'
const MAX_DAYS_AHEAD = 3
const UNKNOWN_ID = 0

const windowCases: [string, string, boolean][] = [
  ['yesterday', addDays(TODAY, -1), false],
  ['today', TODAY, true],
  ['the last bookable day', addDays(TODAY, MAX_DAYS_AHEAD), true],
  ['the day after the window', addDays(TODAY, MAX_DAYS_AHEAD + 1), false],
]

const overlapCases: [TimePeriod, TimePeriod, boolean][] = [
  ['BEFORE_LUNCH', 'BEFORE_LUNCH', true],
  ['BEFORE_LUNCH', 'AFTER_LUNCH', false],
  ['BEFORE_LUNCH', 'ALL_DAY', true],
  ['AFTER_LUNCH', 'BEFORE_LUNCH', false],
  ['AFTER_LUNCH', 'AFTER_LUNCH', true],
  ['AFTER_LUNCH', 'ALL_DAY', true],
  ['ALL_DAY', 'BEFORE_LUNCH', true],
  ['ALL_DAY', 'AFTER_LUNCH', true],
  ['ALL_DAY', 'ALL_DAY', true],
]

const unbookableStatuses: BookingStatus[] = ['CANCELLED', 'COMPLETE']

describe('bookingsService', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let bookings: BookingsRepository
  let service: BookingsService
  let alice: number
  let bob: number
  let roomId: number
  let seatA: number
  let seatB: number
  let otherRoomSeat: number
  let deletedSeat: number
  let seatInDeletedRoom: number
  let seats: ReturnType<typeof createSeatsRepository>

  const book = (userId: number, overrides: Partial<NewBooking> = {}) =>
    service.create(userId, {
      seatId: seatA,
      bookingDate: TODAY,
      timePeriod: 'BEFORE_LUNCH',
      ...overrides,
    })

  const statusesOf = async (userId: number) =>
    (await bookings.findByUserId(userId, { page: 1, pageSize: 100 })).items.map(
      ({ status }) => status,
    )

  const candidate = (id: number): BookingActor => ({ id, role: 'CANDIDATE' })
  const admin = (id: number): BookingActor => ({ id, role: 'ADMIN' })

  const assertBookingRejected = async (
    userId: number,
    overrides: Partial<NewBooking>,
    error: typeof AppError,
  ) => {
    await assert.rejects(book(userId, overrides), error)
    assert.deepEqual(await statusesOf(userId), [])
  }

  before(() => {
    fixtures = createFixtures(db())
    bookings = createBookingsRepository(db())
    seats = createSeatsRepository(db())
    service = createBookingsService({
      bookings,
      seats,
      rooms: createRoomsRepository(db()),
      today: () => TODAY,
    })
  })

  beforeEach(async () => {
    ;({ alice, bob, roomId, seatA, seatB } = await fixtures.seedFreshOffice(MAX_DAYS_AHEAD))
    const otherRoomId = await fixtures.storeRoom('other-room', MAX_DAYS_AHEAD)
    otherRoomSeat = await fixtures.storeSeat(otherRoomId, 'B1')
    deletedSeat = await fixtures.storeSeat(roomId, 'A3')
    const deletedRoom = await fixtures.storeRoom('deleted-room')
    seatInDeletedRoom = await fixtures.storeSeat(deletedRoom, 'D1')
    await fixtures.deleteRoom(deletedRoom)
  })

  it('create returns an ACTIVE booking for the requesting user', async () => {
    assert.partialDeepStrictEqual(await book(alice), {
      seatId: seatA,
      userId: alice,
      bookingDate: TODAY,
      timePeriod: 'BEFORE_LUNCH',
      status: 'ACTIVE',
    })
  })

  for (const [label, bookingDate, allowed] of windowCases) {
    it(`create ${allowed ? 'accepts' : 'rejects'} a booking for ${label}`, async () => {
      if (allowed)
        assert.partialDeepStrictEqual(await book(alice, { bookingDate }), { bookingDate })
      else await assertBookingRejected(alice, { bookingDate }, ValidationError)
    })
  }

  it('create rejects an unknown seat', async () => {
    await assertBookingRejected(alice, { seatId: UNKNOWN_ID }, NotFoundError)
  })

  it('create rejects a seat whose room has been deleted', async () => {
    await assertBookingRejected(alice, { seatId: seatInDeletedRoom }, NotFoundError)
  })

  for (const [existing, requested, conflicts] of overlapCases) {
    const outcome = conflicts ? 'rejects' : 'allows'
    it(`create ${outcome} ${requested} when ${existing} is already booked`, async () => {
      await book(alice, { timePeriod: existing })
      if (conflicts) await assertBookingRejected(bob, { timePeriod: requested }, ConflictError)
      else
        assert.partialDeepStrictEqual(await book(bob, { timePeriod: requested }), {
          userId: bob,
          timePeriod: requested,
        })
    })
  }

  it('create lets only one of several simultaneous bookings for the same slot through', async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) => book(index % 2 === 0 ? alice : bob)),
    )
    const rejected = attempts.filter((attempt) => attempt.status === 'rejected')

    assert.equal(attempts.length - rejected.length, 1)
    assert.ok(rejected.every((attempt) => attempt.reason instanceof ConflictError))
    assert.equal((await bookings.findBySeatAndDate(seatA, TODAY)).length, 1)
  })

  it('create allows the same period on another seat or another date', async () => {
    await book(alice)
    await book(bob, { seatId: seatB })
    await book(bob, { bookingDate: addDays(TODAY, 1) })
    assert.deepEqual(await statusesOf(bob), ['ACTIVE', 'ACTIVE'])
  })

  for (const [existing, requested, conflicts] of overlapCases) {
    const outcome = conflicts ? 'rejects' : 'allows'
    it(`create ${outcome} a second seat for ${requested} when the user holds ${existing}`, async () => {
      await book(alice, { timePeriod: existing })
      const second = book(alice, { seatId: seatB, timePeriod: requested })
      if (conflicts) await assert.rejects(second, ConflictError)
      else await second
      assert.equal((await statusesOf(alice)).length, conflicts ? 1 : 2)
    })
  }

  it('create lets only one of simultaneous bookings by one user on two seats through', async () => {
    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) =>
        book(alice, { seatId: index % 2 === 0 ? seatA : seatB }),
      ),
    )
    const rejected = attempts.filter((attempt) => attempt.status === 'rejected')

    assert.equal(attempts.length - rejected.length, 1)
    assert.ok(rejected.every((attempt) => attempt.reason instanceof ConflictError))
    assert.deepEqual(await statusesOf(alice), ['ACTIVE'])
  })

  for (const status of unbookableStatuses) {
    it(`create allows a second seat once the user's first booking is ${status}`, async () => {
      const first = await book(alice)
      await bookings.updateStatus(first.id, status)
      assert.partialDeepStrictEqual(await book(alice, { seatId: seatB }), { status: 'ACTIVE' })
    })
  }

  for (const status of unbookableStatuses) {
    it(`create allows rebooking a slot whose booking is ${status}`, async () => {
      const first = await book(alice)
      await bookings.updateStatus(first.id, status)
      assert.partialDeepStrictEqual(await book(bob), { userId: bob, status: 'ACTIVE' })
    })
  }

  it('cancel lets the owner cancel an active booking and frees the slot', async () => {
    const booking = await book(alice)
    await service.cancel(candidate(alice), booking.id)

    assert.deepEqual(await statusesOf(alice), ['CANCELLED'])
    assert.partialDeepStrictEqual(await book(bob), { status: 'ACTIVE' })
  })

  it("cancel rejects cancelling another user's booking", async () => {
    const booking = await book(alice)

    await assert.rejects(service.cancel(candidate(bob), booking.id), ForbiddenError)
    assert.deepEqual(await statusesOf(alice), ['ACTIVE'])
  })

  it("cancel lets an admin cancel another user's active booking", async () => {
    const booking = await book(alice)
    await service.cancel(admin(bob), booking.id)

    assert.deepEqual(await statusesOf(alice), ['CANCELLED'])
  })

  for (const status of unbookableStatuses) {
    it(`cancel rejects a booking that is already ${status}`, async () => {
      const booking = await book(alice)
      await bookings.updateStatus(booking.id, status)

      await assert.rejects(service.cancel(candidate(alice), booking.id), ConflictError)
      await assert.rejects(service.cancel(admin(bob), booking.id), ConflictError)
      assert.deepEqual(await statusesOf(alice), [status])
    })
  }

  it('cancel rejects an unknown booking', async () => {
    await assert.rejects(service.cancel(candidate(alice), UNKNOWN_ID), NotFoundError)
  })

  it('findForRoomOnDate returns only active bookings on active seats in the requested room and date', async () => {
    const cancelled = await book(alice)
    await service.cancel(candidate(alice), cancelled.id)
    const active = await book(bob)
    const completed = await book(alice, { seatId: seatB, timePeriod: 'AFTER_LUNCH' })
    await bookings.updateStatus(completed.id, 'COMPLETE')
    await book(alice, { seatId: deletedSeat })
    await seats.delete(deletedSeat)
    await book(bob, { seatId: otherRoomSeat, timePeriod: 'AFTER_LUNCH' })
    await book(alice, { seatId: seatB, bookingDate: addDays(TODAY, 1) })

    assert.deepEqual(await service.findForRoomOnDate(roomId, TODAY), [
      {
        id: active.id,
        seatId: seatA,
        userId: bob,
        status: 'ACTIVE',
        bookingDate: TODAY,
        timePeriod: 'BEFORE_LUNCH',
        user: { name: 'bob', avatarPath: null },
      },
    ])
  })

  it('findForRoomOnDate returns an empty list when the room has no bookings on that date', async () => {
    assert.deepEqual(await service.findForRoomOnDate(roomId, TODAY), [])
  })

  it('findForRoomOnDate rejects an unknown room', async () => {
    await assert.rejects(service.findForRoomOnDate(UNKNOWN_ID, TODAY), NotFoundError)
  })

  it('findForUser returns paginated bookings with room and seat details', async () => {
    await book(alice)
    await book(bob, { seatId: seatB, timePeriod: 'AFTER_LUNCH' })

    assert.partialDeepStrictEqual(await service.findForUser(alice, { page: 1, pageSize: 20 }), {
      page: 1,
      pageSize: 20,
      total: 1,
      items: [
        {
          userId: alice,
          roomName: 'room-a',
          roomSlug: 'room-a',
          seatNumber: 'A1',
        },
      ],
    })
  })

  it('getStatsForUser returns booking statistics for the requested user', async () => {
    await book(alice)
    await book(bob, { seatId: seatB, timePeriod: 'AFTER_LUNCH' })

    const expectedMonths = Array.from({ length: 6 }, (_, i) => {
      const [year, month] = TODAY.slice(0, 7).split('-').map(Number)
      const d = new Date(Date.UTC(year, month - 1 - (5 - i), 1))
      const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      return {
        month: ym,
        count: ym === TODAY.slice(0, 7) ? 1 : 0,
      }
    })

    assert.deepEqual(await service.getStatsForUser(alice), {
      upcoming: 1,
      completed: 0,
      cancelled: 0,
      thisMonth: 1,
      favouriteRoom: {
        name: 'room-a',
        slug: 'room-a',
        count: 1,
      },
      favouriteSeat: {
        seatNumber: 'A1',
        roomName: 'room-a',
        count: 1,
      },
      byPeriod: {
        BEFORE_LUNCH: 1,
        AFTER_LUNCH: 0,
        ALL_DAY: 0,
      },
      perMonth: expectedMonths,
    })
  })
  it('findAll returns paginated bookings with user details', async () => {
    await book(alice)
    await book(bob, { seatId: seatB, timePeriod: 'AFTER_LUNCH' })

    assert.partialDeepStrictEqual(await service.findAll({}, { page: 1, pageSize: 20 }), {
      page: 1,
      pageSize: 20,
      total: 2,
      items: [
        {
          user: {
            id: bob,
            name: 'bob',
            email: 'bob@example.com',
            avatarPath: null,
          },
        },
        {
          user: {
            id: alice,
            name: 'alice',
            email: 'alice@example.com',
            avatarPath: null,
          },
        },
      ],
    })
  })
})
