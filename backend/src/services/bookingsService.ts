import {
  periodsOverlap,
  type BookingDto,
  type MyBookingDto,
  type NewBooking,
  type RoomBookingDto,
  type TimePeriod,
} from '../../../contracts/booking.js'
import type { PaginatedResponse, Pagination } from '../../../contracts/pagination.js'
import { ConflictError, ForbiddenError, ValidationError } from '../errors/appErrors.js'
import type {
  Booking,
  BookingsRepository,
  MyBooking,
  RoomBooking,
} from '../repositories/bookingsRepository.js'
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

const toBookingDto = ({
  id,
  seatId,
  userId,
  status,
  bookingDate,
  timePeriod,
}: Booking): BookingDto => ({
  id,
  seatId,
  userId,
  status,
  bookingDate,
  timePeriod,
})

const toMyBookingDto = ({
  id,
  seatId,
  userId,
  status,
  bookingDate,
  timePeriod,
  roomName,
  roomSlug,
  seatNumber,
}: MyBooking): MyBookingDto => ({
  id,
  seatId,
  userId,
  status,
  bookingDate,
  timePeriod,
  roomName,
  roomSlug,
  seatNumber,
})

const toRoomBookingDto = ({
  userName,
  userAvatarPath,
  ...booking
}: RoomBooking): RoomBookingDto => ({
  ...toBookingDto(booking),
  user: { name: userName, avatarPath: userAvatarPath },
})

const isActive = (booking: BookingDto) => booking.status === 'ACTIVE'

const hasActiveOverlap = (existing: BookingDto[], requested: TimePeriod) =>
  existing.some((booking) => isActive(booking) && periodsOverlap(booking.timePeriod, requested))

const assertWithinBookingWindow = (bookingDate: string, today: string, maxDaysAhead: number) => {
  const lastBookableDate = addDays(today, maxDaysAhead)
  if (bookingDate < today || bookingDate > lastBookableDate)
    throw new ValidationError(`Bookings must be between ${today} and ${lastBookableDate}`)
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

    //Rule: Booking must be between the current date and the room's maxDaysAhead
    assertWithinBookingWindow(bookingDate, today(), room.maxDaysAhead)

    return bookings.withSeatAndUserLock(seatId, userId, async (locked) => {
      //Rule: A seat can only have one active booking per time period
      if (hasActiveOverlap(await locked.findBySeatAndDate(seatId, bookingDate), timePeriod))
        throw new ConflictError('Seat is already booked for that period')

      //Rule: The user can NOT have multiple bookings in the same time period
      if (hasActiveOverlap(await locked.findByUserIdAndDate(userId, bookingDate), timePeriod))
        throw new ConflictError('You already have a booking for that period')

      return toBookingDto(await locked.create({ ...request, userId }))
    })
  }

  const cancel = async (userId: number, bookingId: number): Promise<void> => {
    const booking = await findOrThrow(bookings.findById(bookingId), 'Booking')

    //Rule: Users can only cancel their own bookings
    if (booking.userId !== userId) throw new ForbiddenError('You can only cancel your own bookings')

    //Rule: Only bookings with "ACTIVE" status can be cancelled
    if (!isActive(booking)) throw new ConflictError('Only active bookings can be cancelled')
    await bookings.updateStatus(bookingId, 'CANCELLED')
  }

  const findForUser = async (
    userId: number,
    pagination: Pagination,
  ): Promise<PaginatedResponse<MyBookingDto>> => {
    const { items, total } = await bookings.findByUserId(userId, pagination)
    return { ...pagination, items: items.map(toMyBookingDto), total }
  }

  const findForRoomOnDate = async (roomId: number, date: string): Promise<RoomBookingDto[]> => {
    await findRoom(roomId)
    const roomBookings = await bookings.findActiveByRoomAndDate(roomId, date)
    return roomBookings.map(toRoomBookingDto)
  }

  return { create, cancel, findForUser, findForRoomOnDate }
}

export type BookingsService = ReturnType<typeof createBookingsService>
