import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { CreateBookingRequest } from '../../../contracts/booking.js'
import {
  createBookingsRepository,
  type Booking,
  type BookingsRepository,
} from '../../src/repositories/bookingsRepository.js'
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
  let seatA: number
  let seatB: number

  const request = (overrides: Partial<CreateBookingRequest> = {}): CreateBookingRequest => ({
    seatId: seatA,
    userId: alice,
    bookingDate: DATE,
    timePeriod: 'BEFORE_LUNCH',
    ...overrides,
  })

  const book = (overrides?: Partial<CreateBookingRequest>): Promise<Booking> =>
    bookings.create(request(overrides))

  before(() => {
    fixtures = createFixtures(db())
    bookings = createBookingsRepository(db())
  })

  beforeEach(async () => {
    ;({ alice, bob, seatA, seatB } = await fixtures.seedFreshOffice())
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

    assert.deepEqual(await bookings.findByUserId(alice), [first, second])
  })

  it('findByUserId returns an empty list when the user has no bookings', async () => {
    await book()
    assert.deepEqual(await bookings.findByUserId(bob), [])
  })

  it('findBySeatAndDate excludes other seats and other dates, ordered by id', async () => {
    const morning = await book()
    await book({ seatId: seatB })
    await book({ bookingDate: OTHER_DATE })
    const afternoon = await book({ userId: bob, timePeriod: 'AFTER_LUNCH' })

    assert.deepEqual(await bookings.findBySeatAndDate(seatA, DATE), [morning, afternoon])
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
