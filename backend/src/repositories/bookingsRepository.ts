import type { ResultSetHeader, RowDataPacket, Pool } from 'mysql2/promise'
import type { BookingDto, BookingStatus, CreateBookingRequest } from '../../../contracts/booking.js'

interface BookingRow extends RowDataPacket {
  id: number
  seatId: number
  userId: number
  status: BookingStatus
  bookingDate: Date | string
  timePeriod: BookingDto['timePeriod']
  updatedAt: Date | string
  createdAt: Date | string
}

const bookingColumns = `
  id,
  seat_id AS seatId,
  user_id AS userId,
  status,
  booking_date AS bookingDate,
  time_period AS timePeriod,
  updated_at AS updatedAt,
  created_at AS createdAt
`

const toDateOnly = (value: Date | string) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10)

const toTimestamp = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString()

const toBookingDto = (row: BookingRow): BookingDto => ({
  id: row.id,
  seatId: row.seatId,
  userId: row.userId,
  status: row.status,
  bookingDate: toDateOnly(row.bookingDate),
  timePeriod: row.timePeriod,
  updatedAt: toTimestamp(row.updatedAt),
  createdAt: toTimestamp(row.createdAt),
})

export const createBookingsRepository = (db: Pool) => {
  const findById = async (id: number): Promise<BookingDto | null> => {
    const [rows] = await db.execute<BookingRow[]>(
      `SELECT ${bookingColumns} FROM bookings WHERE id = ?`,
      [id],
    )
    return rows[0] ? toBookingDto(rows[0]) : null
  }

  const create = async (booking: CreateBookingRequest): Promise<BookingDto> => {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO bookings (seat_id, user_id, status, booking_date, time_period)
       VALUES (?, ?, 'ACTIVE', ?, ?)`,
      [booking.seatId, booking.userId, booking.bookingDate, booking.timePeriod],
    )
    const createdBooking = await findById(result.insertId)
    if (!createdBooking) throw new Error(`Booking ${result.insertId} was not found after creation`)
    return createdBooking
  }

  const findByUserId = async (userId: number): Promise<BookingDto[]> => {
    const [rows] = await db.execute<BookingRow[]>(
      `SELECT ${bookingColumns} FROM bookings WHERE user_id = ? ORDER BY id`,
      [userId],
    )
    return rows.map(toBookingDto)
  }

  const findBySeatAndDate = async (seatId: number, date: string): Promise<BookingDto[]> => {
    const [rows] = await db.execute<BookingRow[]>(
      `SELECT ${bookingColumns}
       FROM bookings
       WHERE seat_id = ? AND booking_date = ?
       ORDER BY id`,
      [seatId, date],
    )
    return rows.map(toBookingDto)
  }

  const updateStatus = async (id: number, status: BookingStatus): Promise<BookingDto | null> => {
    await db.execute<ResultSetHeader>('UPDATE bookings SET status = ? WHERE id = ?', [status, id])
    return findById(id)
  }

  return { create, findById, findByUserId, findBySeatAndDate, updateStatus }
}

export type BookingsRepository = ReturnType<typeof createBookingsRepository>
