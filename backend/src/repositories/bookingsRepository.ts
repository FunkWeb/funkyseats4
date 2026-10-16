import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { BookingDto, BookingStatus, CreateBookingRequest } from '../../../contracts/booking.js'
import type { QueryParams } from '../database/queryParams.js'

export interface Booking extends BookingDto {
  updatedAt: Date
  createdAt: Date
}

type BookingRow = Booking & RowDataPacket

const bookingColumns = `
  id,
  seat_id AS seatId,
  user_id AS userId,
  status,
  DATE_FORMAT(booking_date, '%Y-%m-%d') AS bookingDate,
  time_period AS timePeriod,
  updated_at AS updatedAt,
  created_at AS createdAt
`

export const createBookingsRepository = (db: Pool) => {
  const selectBookings = async (clause: string, params: QueryParams): Promise<Booking[]> => {
    const [rows] = await db.execute<BookingRow[]>(
      `SELECT ${bookingColumns} FROM bookings ${clause}`,
      params,
    )
    return rows
  }

  const findById = async (id: number): Promise<Booking | null> => {
    const [booking] = await selectBookings('WHERE id = :id', { id })
    return booking ?? null
  }

  const create = async (booking: CreateBookingRequest): Promise<Booking> => {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO bookings (seat_id, user_id, status, booking_date, time_period)
       VALUES (:seatId, :userId, 'ACTIVE', :bookingDate, :timePeriod)`,
      booking,
    )
    const createdBooking = await findById(result.insertId)
    if (!createdBooking) throw new Error(`Booking ${result.insertId} was not found after creation`)
    return createdBooking
  }

  const findByUserId = (userId: number): Promise<Booking[]> =>
    selectBookings('WHERE user_id = :userId ORDER BY id', { userId })

  const findBySeatAndDate = (seatId: number, date: string): Promise<Booking[]> =>
    selectBookings('WHERE seat_id = :seatId AND booking_date = :date ORDER BY id', {
      seatId,
      date,
    })

  const updateStatus = async (id: number, status: BookingStatus): Promise<Booking | null> => {
    await db.execute<ResultSetHeader>('UPDATE bookings SET status = :status WHERE id = :id', {
      status,
      id,
    })
    return findById(id)
  }

  return { create, findById, findByUserId, findBySeatAndDate, updateStatus }
}

export type BookingsRepository = ReturnType<typeof createBookingsRepository>
