import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type {
  BookingDto,
  BookingStatsDto,
  BookingStatus,
  MyBookingDto,
  NewBooking,
  TimePeriod,
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

export type BookingInsert = NewBooking & Pick<BookingDto, 'userId'>

type BookingRow = Booking & RowDataPacket
type RoomBookingRow = RoomBooking & RowDataPacket
type MyBookingRow = MyBooking & RowDataPacket

type StatusCountRow = {
  upcoming: number | string | null
  completed: number | string | null
  cancelled: number | string | null
  thisMonth: number | string | null
} & RowDataPacket

type FavouriteRoomRow = {
  name: string
  slug: string
  count: number | string
} & RowDataPacket

type FavouriteSeatRow = {
  seatNumber: string
  roomName: string
  count: number | string
} & RowDataPacket

type PeriodCountRow = {
  timePeriod: TimePeriod
  count: number | string
} & RowDataPacket

type MonthCountRow = {
  month: string
  count: number | string
} & RowDataPacket

const BOOKING_COLUMNS = `
  bookings.id,
  bookings.seat_id                    AS seatId,
  bookings.user_id                    AS userId,
  bookings.status,
  DATE_FORMAT(bookings.booking_date, '%Y-%m-%d') AS bookingDate,
  bookings.time_period                AS timePeriod,
  bookings.updated_at                 AS updatedAt,
  bookings.created_at                 AS createdAt`

const SELECT_BOOKING = `SELECT ${BOOKING_COLUMNS} FROM bookings`

const SELECT_MY_BOOKING = `
  SELECT ${BOOKING_COLUMNS},
    rooms.name                        AS roomName,
    rooms.slug                        AS roomSlug,
    seats.seat_number                 AS seatNumber
  FROM bookings
  INNER JOIN seats ON seats.id = bookings.seat_id
  INNER JOIN rooms ON rooms.id = seats.room_id`

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

  const selectMyBookings = async (clause: string, params: QueryParams): Promise<MyBooking[]> => {
    const [rows] = await db.execute<MyBookingRow[]>(`${SELECT_MY_BOOKING} ${clause}`, params)
    return rows
  }

  return {
    findById,
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
    getStatsByUserId: async (userId: number, today: string): Promise<BookingStatsDto> => {
      const currentMonth = today.slice(0, 7)
      const [yearStr, monthStr] = currentMonth.split('-')
      const baseYear = Number(yearStr)
      const baseMonthIndex = Number(monthStr) - 1

      const months: string[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(baseYear, baseMonthIndex - i, 1))
        months.push(d.toISOString().slice(0, 7))
      }
      const firstMonth = months[0]

      const [[statusRow]] = await db.execute<StatusCountRow[]>(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'ACTIVE' AND DATE_FORMAT(booking_date, '%Y-%m-%d') >= :today THEN 1 ELSE 0 END), 0) AS upcoming,
          COALESCE(SUM(CASE WHEN status IN ('ACTIVE', 'COMPLETE') AND DATE_FORMAT(booking_date, '%Y-%m-%d') < :today THEN 1 ELSE 0 END), 0) AS completed,
          COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelled,
          COALESCE(SUM(CASE WHEN status IN ('ACTIVE', 'COMPLETE') AND DATE_FORMAT(booking_date, '%Y-%m') = :currentMonth THEN 1 ELSE 0 END), 0) AS thisMonth
        FROM bookings
        WHERE user_id = :userId`,
        { userId, today, currentMonth },
      )

      const [roomRows] = await db.execute<FavouriteRoomRow[]>(
        `SELECT
          rooms.name AS name,
          rooms.slug AS slug,
          COUNT(*) AS count
        FROM bookings
        INNER JOIN seats ON seats.id = bookings.seat_id
        INNER JOIN rooms ON rooms.id = seats.room_id
        WHERE bookings.user_id = :userId
          AND bookings.status IN ('ACTIVE', 'COMPLETE')
        GROUP BY rooms.id, rooms.name, rooms.slug
        ORDER BY count DESC, rooms.id ASC
        LIMIT 1`,
        { userId },
      )

      const [seatRows] = await db.execute<FavouriteSeatRow[]>(
        `SELECT
          seats.seat_number AS seatNumber,
          rooms.name AS roomName,
          COUNT(*) AS count
        FROM bookings
        INNER JOIN seats ON seats.id = bookings.seat_id
        INNER JOIN rooms ON rooms.id = seats.room_id
        WHERE bookings.user_id = :userId
          AND bookings.status IN ('ACTIVE', 'COMPLETE')
        GROUP BY seats.id, seats.seat_number, rooms.name
        ORDER BY count DESC, seats.id ASC
        LIMIT 1`,
        { userId },
      )

      const [periodRows] = await db.execute<PeriodCountRow[]>(
        `SELECT
          time_period AS timePeriod,
          COUNT(*) AS count
        FROM bookings
        WHERE user_id = :userId
          AND status IN ('ACTIVE', 'COMPLETE')
        GROUP BY time_period`,
        { userId },
      )

      const [monthRows] = await db.execute<MonthCountRow[]>(
        `SELECT
          DATE_FORMAT(booking_date, '%Y-%m') AS month,
          COUNT(*) AS count
        FROM bookings
        WHERE user_id = :userId
          AND status IN ('ACTIVE', 'COMPLETE')
          AND DATE_FORMAT(booking_date, '%Y-%m') >= :firstMonth
          AND DATE_FORMAT(booking_date, '%Y-%m') <= :currentMonth
        GROUP BY month
        ORDER BY month ASC`,
        { userId, firstMonth, currentMonth },
      )

      const byPeriod: Record<TimePeriod, number> = {
        BEFORE_LUNCH: 0,
        AFTER_LUNCH: 0,
        ALL_DAY: 0,
      }
      for (const row of periodRows) {
        byPeriod[row.timePeriod] = Number(row.count)
      }

      const monthMap = new Map(monthRows.map((row) => [row.month, Number(row.count)]))
      const perMonth = months.map((month) => ({
        month,
        count: monthMap.get(month) ?? 0,
      }))

      const topRoom = roomRows[0]
      const topSeat = seatRows[0]

      return {
        upcoming: Number(statusRow?.upcoming ?? 0),
        completed: Number(statusRow?.completed ?? 0),
        cancelled: Number(statusRow?.cancelled ?? 0),
        thisMonth: Number(statusRow?.thisMonth ?? 0),
        favouriteRoom: topRoom
          ? { name: topRoom.name, slug: topRoom.slug, count: Number(topRoom.count) }
          : null,
        favouriteSeat: topSeat
          ? {
              seatNumber: topSeat.seatNumber,
              roomName: topSeat.roomName,
              count: Number(topSeat.count),
            }
          : null,
        byPeriod,
        perMonth,
      }
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
