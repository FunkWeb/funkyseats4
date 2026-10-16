import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Pool, RowDataPacket } from 'mysql2/promise'
import type { BookingStatus, TimePeriod } from '../../../contracts/booking.js'
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
import {
  createBookingsService,
  type BookingsService,
  type NewBooking,
} from '../../src/services/bookingsService.js'
import { addDays } from '../../src/services/common.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const TODAY = '2030-01-02'
const MAX_DAYS_AHEAD = 3
const UNKNOWN_ID = 0

type SeatRow = RowDataPacket & { roomId: number }

const createSeatLookup = (db: Pool) => ({
  findById: async (id: number) => {
    const [[seat]] = await db.execute<SeatRow[]>(
      'SELECT room_id AS roomId FROM seats WHERE id = :id',
      { id },
    )
    return seat
  },
})

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
  let seatA: number
  let seatB: number
  let seatInDeletedRoom: number

  const book = (userId: number, overrides: Partial<NewBooking> = {}) =>
    service.create(userId, {
      seatId: seatA,
      bookingDate: TODAY,
      timePeriod: 'BEFORE_LUNCH',
      ...overrides,
    })

  const statusesOf = async (userId: number) =>
    (await bookings.findByUserId(userId)).map(({ status }) => status)

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
    service = createBookingsService({
      bookings,
      seats: createSeatLookup(db()),
      rooms: createRoomsRepository(db()),
      today: () => TODAY,
    })
  })

  beforeEach(async () => {
    ;({ alice, bob, seatA, seatB } = await fixtures.seedFreshOffice(MAX_DAYS_AHEAD))
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

  it('create allows the same period on another seat or another date', async () => {
    await book(alice)
    await book(bob, { seatId: seatB })
    await book(bob, { bookingDate: addDays(TODAY, 1) })
    assert.deepEqual(await statusesOf(bob), ['ACTIVE', 'ACTIVE'])
  })

  for (const status of unbookableStatuses) {
    it(`create allows rebooking a slot whose booking is ${status}`, async () => {
      const first = await book(alice)
      await bookings.updateStatus(first.id, status)
      assert.partialDeepStrictEqual(await book(bob), { userId: bob, status: 'ACTIVE' })
    })
  }

  it('cancel lets the owner cancel an active booking and frees the slot', async () => {
    const booking = await book(alice)
    await service.cancel(alice, booking.id)

    assert.deepEqual(await statusesOf(alice), ['CANCELLED'])
    assert.partialDeepStrictEqual(await book(bob), { status: 'ACTIVE' })
  })

  it("cancel rejects cancelling another user's booking", async () => {
    const booking = await book(alice)

    await assert.rejects(service.cancel(bob, booking.id), ForbiddenError)
    assert.deepEqual(await statusesOf(alice), ['ACTIVE'])
  })

  for (const status of unbookableStatuses) {
    it(`cancel rejects a booking that is already ${status}`, async () => {
      const booking = await book(alice)
      await bookings.updateStatus(booking.id, status)

      await assert.rejects(service.cancel(alice, booking.id), ConflictError)
      assert.deepEqual(await statusesOf(alice), [status])
    })
  }

  it('cancel rejects an unknown booking', async () => {
    await assert.rejects(service.cancel(alice, UNKNOWN_ID), NotFoundError)
  })
})
