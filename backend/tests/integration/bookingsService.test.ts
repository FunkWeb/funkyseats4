import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { BookingDto, BookingStatus, TimePeriod } from '../../../contracts/booking.js'
import type { QueryParams } from '../../src/database/queryParams.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../src/errors/appErrors.js'
import {
  createBookingsService,
  type BookingsService,
  type BookingsServiceDeps,
} from '../../src/services/bookingsService.js'
import { addDays } from '../../src/services/common.js'
import { useMigratedTestDatabase } from '../testDatabase.js'

const TODAY = '2030-01-02'
const MAX_DAYS_AHEAD = 3
const UNKNOWN_ID = 0

type BookingRow = BookingDto & RowDataPacket

const SELECT_BOOKINGS = `
  SELECT
    id,
    seat_id AS seatId,
    user_id AS userId,
    status,
    DATE_FORMAT(booking_date, '%Y-%m-%d') AS bookingDate,
    time_period AS timePeriod,
    updated_at AS updatedAt,
    created_at AS createdAt
  FROM bookings`

const createDeps = (db: Pool): Omit<BookingsServiceDeps, 'today'> => {
  const rowsOf = async <T extends RowDataPacket>(sql: string, params: QueryParams) => {
    const [rows] = await db.execute<T[]>(sql, params)
    return rows
  }
  const firstOf = async <T>(rows: Promise<T[]>): Promise<T | undefined> => (await rows)[0]
  const bookingsWhere = (clause: string, params: QueryParams) =>
    rowsOf<BookingRow>(`${SELECT_BOOKINGS} ${clause}`, params)

  return {
    bookings: {
      findById: (id) => firstOf(bookingsWhere('WHERE id = :id', { id })),
      findByUserId: (userId) => bookingsWhere('WHERE user_id = :userId ORDER BY id', { userId }),
      findActiveBySeatAndDate: (seatId, bookingDate) =>
        bookingsWhere(
          `WHERE seat_id = :seatId AND booking_date = :bookingDate AND status = 'ACTIVE'`,
          { seatId, bookingDate },
        ),
      create: async (userId, booking) => {
        const [result] = await db.execute<ResultSetHeader>(
          `INSERT INTO bookings (seat_id, user_id, status, booking_date, time_period)
           VALUES (:seatId, :userId, 'ACTIVE', :bookingDate, :timePeriod)`,
          { ...booking, userId },
        )
        return result.insertId
      },
      cancel: async (id) => {
        const [result] = await db.execute<ResultSetHeader>(
          `UPDATE bookings SET status = 'CANCELLED' WHERE id = :id`,
          { id },
        )
        return result.affectedRows === 1
      },
    },
    seats: {
      findById: (id) =>
        firstOf(
          rowsOf<RowDataPacket & { roomId: number }>(
            'SELECT room_id AS roomId FROM seats WHERE id = :id AND deleted_at IS NULL',
            { id },
          ),
        ),
    },
    rooms: {
      findById: (id) =>
        firstOf(
          rowsOf<RowDataPacket & { maxDaysAhead: number }>(
            'SELECT max_days_ahead AS maxDaysAhead FROM rooms WHERE id = :id AND deleted_at IS NULL',
            { id },
          ),
        ),
    },
  }
}

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
  let service: BookingsService
  let alice: number
  let bob: number
  let seatA: number
  let seatB: number
  let seatInDeletedRoom: number

  const insert = async (sql: string, params: Record<string, string | number>) => {
    const [result] = await db().execute<ResultSetHeader>(sql, params)
    return result.insertId
  }

  const storeUser = (name: string) =>
    insert(
      `INSERT INTO users (google_id, name, email, role) VALUES (:googleId, :name, :email, 'CANDIDATE')`,
      { googleId: `google-${name}`, name, email: `${name}@example.com` },
    )

  const storeRoom = (slug: string, deleted: number) =>
    insert(
      `INSERT INTO rooms (slug, name, max_days_ahead, deleted_at)
       VALUES (:slug, :slug, :maxDaysAhead, IF(:deleted, CURRENT_TIMESTAMP, NULL))`,
      { slug, maxDaysAhead: MAX_DAYS_AHEAD, deleted },
    )

  const storeSeat = (roomId: number, seatNumber: string) =>
    insert('INSERT INTO seats (room_id, seat_number) VALUES (:roomId, :seatNumber)', {
      roomId,
      seatNumber,
    })

  const book = (
    userId: number,
    overrides: Partial<{ seatId: number; bookingDate: string; timePeriod: TimePeriod }> = {},
  ) =>
    service.create(userId, {
      seatId: seatA,
      bookingDate: TODAY,
      timePeriod: 'BEFORE_LUNCH',
      ...overrides,
    })

  const statusesOf = async (userId: number) =>
    (await service.findForUser(userId)).map(({ status }) => status)

  const forceStatus = (id: number, status: BookingStatus) =>
    db().execute('UPDATE bookings SET status = :status WHERE id = :id', { status, id })

  before(() => {
    service = createBookingsService({ ...createDeps(db()), today: () => TODAY })
  })

  beforeEach(async () => {
    for (const table of ['bookings', 'seat_features', 'seats', 'rooms', 'users']) {
      await db().query(`DELETE FROM ${table}`)
    }
    ;[alice, bob] = [await storeUser('alice'), await storeUser('bob')]
    const openRoom = await storeRoom('open-room', 0)
    const deletedRoom = await storeRoom('deleted-room', 1)
    ;[seatA, seatB] = [await storeSeat(openRoom, 'A1'), await storeSeat(openRoom, 'A2')]
    seatInDeletedRoom = await storeSeat(deletedRoom, 'D1')
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
      const attempt = book(alice, { bookingDate })
      if (allowed) assert.partialDeepStrictEqual(await attempt, { bookingDate })
      else await assert.rejects(attempt, ValidationError)
    })
  }

  it('create rejects an unknown seat', async () => {
    await assert.rejects(book(alice, { seatId: UNKNOWN_ID }), NotFoundError)
  })

  it('create rejects a seat whose room has been deleted', async () => {
    await assert.rejects(book(alice, { seatId: seatInDeletedRoom }), NotFoundError)
  })

  for (const [existing, requested, conflicts] of overlapCases) {
    it(`create ${conflicts ? 'rejects' : 'allows'} ${requested} when ${existing} is already booked`, async () => {
      await book(alice, { timePeriod: existing })
      const attempt = book(bob, { timePeriod: requested })

      if (conflicts) {
        await assert.rejects(attempt, ConflictError)
        assert.deepEqual(await statusesOf(bob), [])
      } else {
        assert.partialDeepStrictEqual(await attempt, { userId: bob, timePeriod: requested })
      }
    })
  }

  it('create allows the same period on another seat or another date', async () => {
    await book(alice)
    await book(bob, { seatId: seatB })
    await book(bob, { bookingDate: addDays(TODAY, 1) })
    assert.equal((await service.findForUser(bob)).length, 2)
  })

  for (const status of unbookableStatuses) {
    it(`create allows rebooking a slot whose booking is ${status}`, async () => {
      const first = await book(alice)
      await forceStatus(first.id, status)
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
      await forceStatus(booking.id, status)

      await assert.rejects(service.cancel(alice, booking.id), ConflictError)
      assert.deepEqual(await statusesOf(alice), [status])
    })
  }

  it('cancel rejects an unknown booking', async () => {
    await assert.rejects(service.cancel(alice, UNKNOWN_ID), NotFoundError)
  })

  it('findForUser returns only that user’s bookings', async () => {
    await book(alice)
    await book(bob, { seatId: seatB })

    assert.deepEqual(
      (await service.findForUser(alice)).map(({ userId }) => userId),
      [alice],
    )
  })
})
