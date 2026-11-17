import type { BookingDto, NewBooking, TimePeriod } from '../../../contracts/booking.js'
import type { PaginatedResponse } from '../../../contracts/pagination.js'
import { ConflictError, ForbiddenError, ValidationError } from '../errors/appErrors.js'
import type { BookingsRepository } from '../repositories/bookingsRepository.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import type { SeatsRepository } from '../repositories/seatsRepository.js'
import { addDays, findOrThrow, todayInOffice } from './common.js'

export interface BookingsServiceDeps {
  bookings: Pick<
    BookingsRepository,
    'findById' | 'findByUserId' | 'findActiveByRoomAndDate' | 'updateStatus' | 'withSeatAndUserLock'
  >
  seats: Pick<SeatsRepository, 'findById'>
  rooms: Pick<RoomsRepository, 'findById'>
  today?: () => string
}

const periodsOverlap = (a: TimePeriod, b: TimePeriod) =>
  a === b || a === 'ALL_DAY' || b === 'ALL_DAY'

const blocksPeriod = (booking: BookingDto, period: TimePeriod) =>
  booking.status === 'ACTIVE' && periodsOverlap(booking.timePeriod, period)

const assertWithinBookingWindow = (bookingDate: string, today: string, maxDaysAhead: number) => {
  const lastBookableDate = addDays(today, maxDaysAhead)
  if (bookingDate < today || bookingDate > lastBookableDate) {
    throw new ValidationError(`Bookings must be between ${today} and ${lastBookableDate}`)
  }
}

export const createBookingsService = ({
  bookings,
  seats,
  rooms,
  today = todayInOffice,
}: BookingsServiceDeps) => {
  const create = async (userId: number, request: NewBooking): Promise<BookingDto> => {
    const seat = await findOrThrow(seats.findById(request.seatId), 'Seat')
    const room = await findOrThrow(rooms.findById(seat.roomId), 'Room')

    assertWithinBookingWindow(request.bookingDate, today(), room.maxDaysAhead)

    return bookings.withSeatAndUserLock(request.seatId, userId, async (lockedBookings) => {
      const sameDay = await lockedBookings.findBySeatAndDate(request.seatId, request.bookingDate)
      if (sameDay.some((booking) => blocksPeriod(booking, request.timePeriod))) {
        throw new ConflictError('Seat is already booked for that period')
      }

      const ownSameDay = await lockedBookings.findByUserIdAndDate(userId, request.bookingDate)
      if (ownSameDay.some((booking) => blocksPeriod(booking, request.timePeriod))) {
        throw new ConflictError('You already have a booking for that period')
      }

      return lockedBookings.create({ ...request, userId })
    })
  }

  const cancel = async (userId: number, bookingId: number): Promise<void> => {
    const booking = await findOrThrow(bookings.findById(bookingId), 'Booking')
    if (booking.userId !== userId) throw new ForbiddenError('You can only cancel your own bookings')
    if (booking.status !== 'ACTIVE') {
      throw new ConflictError('Only active bookings can be cancelled')
    }
    await bookings.updateStatus(bookingId, 'CANCELLED')
  }

  const findForUser = async (
    userId: number,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<BookingDto>> => {
    const { items, total } = await bookings.findByUserId(userId, page, pageSize)
    return {
      items,
      total,
      page,
      pageSize,
    }
  }

  return {
    create,
    cancel,
    findForUser: bookings.findByUserId,
    findForRoomOnDate: async (roomId: number, date: string): Promise<BookingDto[]> => {
      await findOrThrow(rooms.findById(roomId), 'Room')
      return (await bookings.findActiveByRoomAndDate(roomId, date)).map(
        ({ id, seatId, userId, status, bookingDate, timePeriod }) => ({
          id,
          seatId,
          userId,
          status,
          bookingDate,
          timePeriod,
        }),
      )
    },
  }
}

export type BookingsService = ReturnType<typeof createBookingsService>
