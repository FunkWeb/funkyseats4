import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createBookingsRepository,
  type Booking,
  type BookingInsert,
  type BookingsRepository,
} from '../../src/repositories/bookingsRepository.js'
import { createSeatsRepository } from '../../src/repositories/seatsRepository.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const UNKNOWN_ID = 0
const DATE = '2030-01-02'
const OTHER_DATE = '2030-01-03'

describe('bookingsRepository', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let bookings: BookingsRepository
  let alice: number
  let bob: number
  let roomId: number
  let seatA: number
  let seatB: number
  let otherRoomSeat: number
  let deletedSeat: number

  const request = (overrides: Partial<BookingInsert> = {}): BookingInsert => ({
    seatId: seatA,
    userId: alice,
    bookingDate: DATE,
    timePeriod: 'BEFORE_LUNCH',
    ...overrides,
  })

  const book = (overrides?: Partial<BookingInsert>): Promise<Booking> =>
    bookings.create(request(overrides))

  before(() => {
    fixtures = createFixtures(db())
    bookings = createBookingsRepository(db())
  })

  beforeEach(async () => {
    ;({ alice, bob, roomId, seatA, seatB } = await fixtures.seedFreshOffice())
    const otherRoomId = await fixtures.storeRoom('room-b')
    otherRoomSeat = await fixtures.storeSeat(otherRoomId, 'B1')
    deletedSeat = await fixtures.storeSeat(roomId, 'A3')
  })

  it('create returns an ACTIVE booking matching the request', async () => {
    assert.partialDeepStrictEqual(await book(), { ...request(), status: 'ACTIVE' })
  })

  for (const [target, overrides] of Object.entries({
    seat: { seatId: UNKNOWN_ID },
    user: { userId: UNKNOWN_ID },
  })) {
    it(`create rejects an unknown ${target}`, async () => {
      await assert.rejects(book(overrides), { code: 'ER_NO_REFERENCED_ROW_2' })
    })
  }

  it('findById returns the stored booking', async () => {
    const created = await book()
    assert.deepEqual(await bookings.findById(created.id), created)
  })

  it('findById returns null when nothing matches', async () => {
    await book()
    assert.equal(await bookings.findById(UNKNOWN_ID), null)
  })

  it('findByUserId returns only that user’s bookings, ordered by id', async () => {
    const first = await book()
    await book({ userId: bob, timePeriod: 'AFTER_LUNCH' })
    const second = await book({ seatId: seatB })

    assert.deepEqual((await bookings.findByUserId(alice, 1, 20)).items, [first, second])
  })

  it('findByUserId returns an empty list when the user has no bookings', async () => {
    await book()
    assert.deepEqual((await bookings.findByUserId(bob, 1, 20)).items, [])
  })

  it('findByUserId splits bookings into pages and counts only that user’s bookings', async () => {
    const first = await book()
    const second = await book({ timePeriod: 'AFTER_LUNCH' })
    await book({ userId: bob, seatId: seatB })
    const third = await book({ bookingDate: OTHER_DATE })

    assert.deepEqual(await bookings.findByUserId(alice, 1, 2), { items: [first, second], total: 3 })
    assert.deepEqual(await bookings.findByUserId(alice, 2, 2), { items: [third], total: 3 })
  })

  it('findByUserId returns no items for a page past the last one', async () => {
    await book()
    assert.deepEqual(await bookings.findByUserId(alice, 2, 20), { items: [], total: 1 })
  })

  it('findBySeatAndDate excludes other seats and other dates, ordered by id', async () => {
    const morning = await book()
    await book({ seatId: seatB })
    await book({ bookingDate: OTHER_DATE })
    const afternoon = await book({ userId: bob, timePeriod: 'AFTER_LUNCH' })

    assert.deepEqual(await bookings.findBySeatAndDate(seatA, DATE), [morning, afternoon])
  })

  it('findByUserIdAndDate excludes other users and other dates, ordered by id', async () => {
    const morning = await book()
    await book({ userId: bob, seatId: seatB })
    await book({ bookingDate: OTHER_DATE })
    const afternoon = await book({ seatId: seatB, timePeriod: 'AFTER_LUNCH' })

    assert.deepEqual(await bookings.findByUserIdAndDate(alice, DATE), [morning, afternoon])
  })

  it('findActiveByRoomAndDate includes only active bookings on active seats in that room and date', async () => {
    const active = await book()
    const anotherActive = await book({ seatId: seatB, userId: bob, timePeriod: 'AFTER_LUNCH' })
    const cancelled = await book({ seatId: seatB, bookingDate: DATE })
    await bookings.updateStatus(cancelled.id, 'CANCELLED')
    const completed = await book({ seatId: seatB, bookingDate: DATE })
    await bookings.updateStatus(completed.id, 'COMPLETE')
    await book({ bookingDate: OTHER_DATE })
    await book({ seatId: otherRoomSeat })
    await book({ seatId: deletedSeat })
    await createSeatsRepository(db()).delete(deletedSeat)

    assert.deepEqual(await bookings.findActiveByRoomAndDate(roomId, DATE), [active, anotherActive])
  })

  it('updateStatus persists and returns the new status', async () => {
    const created = await book()
    const cancelled = await bookings.updateStatus(created.id, 'CANCELLED')

    assert.partialDeepStrictEqual(cancelled, { id: created.id, status: 'CANCELLED' })
    assert.deepEqual(await bookings.findById(created.id), cancelled)
  })

  it('updateStatus returns null when nothing matches', async () => {
    assert.equal(await bookings.updateStatus(UNKNOWN_ID, 'CANCELLED'), null)
  })
})
