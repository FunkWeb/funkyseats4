import {
  periodsOverlap,
  type AdminBookingDto,
  type BookingDto,
  type BookingStatsDto,
  type BookingFilters,
  type MyBookingDto,
  type NewBooking,
  type RoomBookingDto,
  type TimePeriod,
} from '../../../contracts/booking.js'
import type { PaginatedResponse, Pagination } from '../../../contracts/pagination.js'
import type { BookingActor } from '../../../contracts/user.js'
import { ConflictError, ForbiddenError, ValidationError } from '../errors/appErrors.js'
import type { BookingsRepository } from '../repositories/bookingsRepository.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import type { SeatsRepository } from '../repositories/seatsRepository.js'
import {
  toAdminBookingDto,
  toBookingDto,
  toMyBookingDto,
  toRoomBookingDto,
} from './bookingMappers.js'
import { addDays, findOrThrow, todayInOffice, toPaginatedResponse } from './common.js'

export interface BookingsServiceDeps {
  bookings: Pick<
    BookingsRepository,
    | 'findAll'
    | 'findById'
    | 'findByUserId'
    | 'findActiveByRoomAndDate'
    | 'updateStatus'
    | 'withSeatAndUserLock'
    | 'getStatsByUserId'
  >
  seats: Pick<SeatsRepository, 'findById'>
  rooms: Pick<RoomsRepository, 'findById'>
  today?: () => string
}

const isActive = (booking: BookingDto) => booking.status === 'ACTIVE'

const hasActiveOverlap = (existing: BookingDto[], requested: TimePeriod) =>
  existing.some((booking) => isActive(booking) && periodsOverlap(booking.timePeriod, requested))

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
  const findRoom = (roomId: number) => findOrThrow(rooms.findById(roomId), 'Room')

  const create = async (userId: number, request: NewBooking): Promise<BookingDto> => {
    const { seatId, bookingDate, timePeriod } = request
    const seat = await findOrThrow(seats.findById(seatId), 'Seat')
    const room = await findRoom(seat.roomId)

    assertWithinBookingWindow(bookingDate, today(), room.maxDaysAhead)

    return bookings.withSeatAndUserLock(seatId, userId, async (locked) => {
      if (hasActiveOverlap(await locked.findBySeatAndDate(seatId, bookingDate), timePeriod)) {
        throw new ConflictError('Seat is already booked for that period')
      }

      if (hasActiveOverlap(await locked.findByUserIdAndDate(userId, bookingDate), timePeriod)) {
        throw new ConflictError('You already have a booking for that period')
      }

      return toBookingDto(await locked.create({ ...request, userId }))
    })
  }

  const cancel = async (actor: BookingActor, bookingId: number): Promise<void> => {
    const booking = await findOrThrow(bookings.findById(bookingId), 'Booking')

    if (actor.role !== 'ADMIN' && booking.userId !== actor.id) {
      throw new ForbiddenError('You can only cancel your own bookings')
    }

    if (!isActive(booking)) throw new ConflictError('Only active bookings can be cancelled')
    await bookings.updateStatus(bookingId, 'CANCELLED')
  }

  const findForUser = (
    userId: number,
    pagination: Pagination,
  ): Promise<PaginatedResponse<MyBookingDto>> =>
    toPaginatedResponse(bookings.findByUserId(userId, pagination), pagination, toMyBookingDto)

  const findAll = (
    filters: BookingFilters,
    pagination: Pagination,
  ): Promise<PaginatedResponse<AdminBookingDto>> =>
    toPaginatedResponse(bookings.findAll(filters, pagination), pagination, toAdminBookingDto)

  const findForRoomOnDate = async (roomId: number, date: string): Promise<RoomBookingDto[]> => {
    await findRoom(roomId)
    const roomBookings = await bookings.findActiveByRoomAndDate(roomId, date)
    return roomBookings.map(toRoomBookingDto)
  }

  const getStatsForUser = (userId: number): Promise<BookingStatsDto> =>
    bookings.getStatsByUserId(userId, today())

  return { create, cancel, findForUser, findAll, findForRoomOnDate, getStatsForUser }
}

export type BookingsService = ReturnType<typeof createBookingsService>
