import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { BookingDto, BookingStatus, NewBooking } from '../../../contracts/booking.js'
import type { Pagination } from '../../../contracts/pagination.js'
import { paginate, type Page } from '../database/paginate.js'
import type { QueryParams } from '../database/queryParams.js'

export interface Booking extends BookingDto {
  updatedAt: Date
  createdAt: Date
}

export interface RoomBooking extends Booking {
  userName: string
  userAvatarPath: string | null
}

export type BookingInsert = NewBooking & Pick<BookingDto, 'userId'>

type BookingRow = Booking & RowDataPacket
type RoomBookingRow = RoomBooking & RowDataPacket

const BOOKING_COLUMNS = `
    bookings.id,
    bookings.seat_id                       AS seatId,
    bookings.user_id                       AS userId,
    bookings.status,
    DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS bookingDate,
    bookings.time_period                   AS timePeriod,
    bookings.updated_at                    AS updatedAt,
    bookings.created_at                    AS createdAt`

const SELECT_BOOKING = `SELECT ${BOOKING_COLUMNS} FROM bookings`

type Executor = Pick<Pool, 'execute'>

const createBookingQueries = (db: Executor) => {
  const selectBookings = async (clause: string, params: QueryParams): Promise<Booking[]> => {
    const [rows] = await db.execute<BookingRow[]>(`${SELECT_BOOKING} ${clause}`, params)
    return rows
  }

  const findById = async (id: number): Promise<Booking | null> => {
    const [booking] = await selectBookings('WHERE id = :id', { id })
    return booking ?? null
  }

  return {
    findById,
    findByUserId: (userId: number, pagination: Pagination): Promise<Page<Booking>> =>
      paginate(
        db,
        {
          select: selectBookings,
          table: 'bookings',
          where: 'WHERE user_id = :userId',
          orderBy: 'id',
          params: { userId },
        },
        pagination,
      ),
    findBySeatAndDate: (seatId: number, date: string): Promise<Booking[]> =>
      selectBookings('WHERE seat_id = :seatId AND booking_date = :date ORDER BY id', {
        seatId,
        date,
      }),
    findByUserIdAndDate: (userId: number, date: string): Promise<Booking[]> =>
      selectBookings('WHERE user_id = :userId AND booking_date = :date ORDER BY id', {
        userId,
        date,
      }),
    findActiveByRoomAndDate: async (roomId: number, date: string): Promise<RoomBooking[]> => {
      const [rows] = await db.execute<RoomBookingRow[]>(
        `SELECT ${BOOKING_COLUMNS},
           users.name        AS userName,
           users.avatar_path AS userAvatarPath
         FROM bookings
         INNER JOIN seats ON seats.id = bookings.seat_id
         INNER JOIN users ON users.id = bookings.user_id
         WHERE seats.room_id = :roomId AND seats.deleted_at IS NULL
           AND bookings.booking_date = :date AND bookings.status = 'ACTIVE'
         ORDER BY bookings.id`,
        { roomId, date },
      )
      return rows
    },
    create: async (booking: BookingInsert): Promise<Booking> => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO bookings (seat_id, user_id, status, booking_date, time_period)
         VALUES (:seatId, :userId, 'ACTIVE', :bookingDate, :timePeriod)`,
        booking,
      )
      const createdBooking = await findById(result.insertId)
      if (!createdBooking)
        throw new Error(`Booking ${result.insertId} was not found after creation`)
      return createdBooking
    },
    updateStatus: async (id: number, status: BookingStatus): Promise<Booking | null> => {
      await db.execute<ResultSetHeader>('UPDATE bookings SET status = :status WHERE id = :id', {
        status,
        id,
      })
      return findById(id)
    },
  }
}

export type BookingQueries = ReturnType<typeof createBookingQueries>

export const createBookingsRepository = (db: Pool) => ({
  ...createBookingQueries(db),
  withSeatAndUserLock: async <T>(
    seatId: number,
    userId: number,
    run: (bookings: BookingQueries) => Promise<T>,
  ): Promise<T> => {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute('SELECT id FROM seats WHERE id = :seatId FOR UPDATE', { seatId })
      await connection.execute('SELECT id FROM users WHERE id = :userId FOR UPDATE', { userId })
      const result = await run(createBookingQueries(connection))
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },
})

export type BookingsRepository = ReturnType<typeof createBookingsRepository>
