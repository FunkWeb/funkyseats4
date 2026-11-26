import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type {
  BookingDto,
  BookingFilters,
  BookingStatus,
  MyBookingDto,
  NewBooking,
} from '../../../contracts/booking.js'
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

export interface MyBooking extends MyBookingDto {
  updatedAt: Date
  createdAt: Date
}

export interface AdminBooking extends MyBooking {
  userName: string
  userEmail: string
  userAvatarPath: string | null
}

export type BookingInsert = NewBooking & Pick<BookingDto, 'userId'>

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

const MY_BOOKING_COLUMNS = `${BOOKING_COLUMNS},
    rooms.name                             AS roomName,
    rooms.slug                             AS roomSlug,
    seats.seat_number                      AS seatNumber`

const MY_BOOKING_FROM = `bookings
  INNER JOIN seats ON seats.id = bookings.seat_id
  INNER JOIN rooms ON rooms.id = seats.room_id`

const ADMIN_BOOKING_FROM = `${MY_BOOKING_FROM}
  INNER JOIN users ON users.id = bookings.user_id`

const SELECT_MY_BOOKING = `SELECT ${MY_BOOKING_COLUMNS} FROM ${MY_BOOKING_FROM}`

const SELECT_ADMIN_BOOKING = `
  SELECT ${MY_BOOKING_COLUMNS},
    users.name                             AS userName,
    users.email                            AS userEmail,
    users.avatar_path                      AS userAvatarPath
  FROM ${ADMIN_BOOKING_FROM}`

const FILTER_CONDITIONS: Record<keyof BookingFilters, string> = {
  fromDate: 'bookings.booking_date >= :fromDate',
  roomId: 'rooms.id = :roomId',
  userId: 'bookings.user_id = :userId',
  status: 'bookings.status = :status',
}

const FILTER_KEYS = Object.keys(FILTER_CONDITIONS) as (keyof BookingFilters)[]

type Executor = Pick<Pool, 'execute'>

const createBookingQueries = (db: Executor) => {
  const selectFrom =
    <T>(sql: string) =>
    async (clause: string, params: QueryParams): Promise<T[]> => {
      const [rows] = await db.execute<(T & RowDataPacket)[]>(`${sql} ${clause}`, params)
      return rows
    }

  const selectBookings = selectFrom<Booking>(SELECT_BOOKING)
  const selectMyBookings = selectFrom<MyBooking>(SELECT_MY_BOOKING)
  const selectAdminBookings = selectFrom<AdminBooking>(SELECT_ADMIN_BOOKING)

  const findById = async (id: number): Promise<Booking | null> => {
    const [booking] = await selectBookings('WHERE id = :id', { id })
    return booking ?? null
  }

  const findAll = (
    filters: BookingFilters,
    pagination: Pagination,
  ): Promise<Page<AdminBooking>> => {
    const conditions: string[] = []
    const params: QueryParams = {}
    for (const key of FILTER_KEYS) {
      const value = filters[key]
      if (value === undefined) continue
      conditions.push(FILTER_CONDITIONS[key])
      params[key] = value
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return paginate(
      db,
      {
        select: selectAdminBookings,
        table: ADMIN_BOOKING_FROM,
        where,
        orderBy: 'bookings.booking_date DESC, bookings.id DESC',
        params,
      },
      pagination,
    )
  }

  return {
    findById,
    findAll,
    findByUserId: (userId: number, pagination: Pagination): Promise<Page<MyBooking>> =>
      paginate(
        db,
        {
          select: selectMyBookings,
          table: 'bookings',
          where: 'WHERE bookings.user_id = :userId',
          orderBy: 'bookings.booking_date DESC, bookings.id DESC',
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
