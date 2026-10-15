import type { BookingDto, CreateBookingRequest, TimePeriod } from '../../../contracts/booking.js'
import { ConflictError, ForbiddenError, ValidationError } from '../errors/appErrors.js'
import { addDays, findOrThrow, todayInOffice } from './common.js'

export interface BookingsServiceDeps {
  bookings: {
    findById: (id: number) => Promise<BookingDto | undefined>
    findByUserId: (userId: number) => Promise<BookingDto[]>
    findActiveBySeatAndDate: (seatId: number, bookingDate: string) => Promise<BookingDto[]>
    create: (userId: number, booking: CreateBookingRequest) => Promise<number>
    cancel: (id: number) => Promise<boolean>
  }
  seats: {
    findById: (id: number) => Promise<{ roomId: number } | undefined>
  }
  rooms: {
    findById: (id: number) => Promise<{ maxDaysAhead: number } | undefined>
  }
  today?: () => string
}

const periodsOverlap = (a: TimePeriod, b: TimePeriod) =>
  a === b || a === 'ALL_DAY' || b === 'ALL_DAY'

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
  const findBooking = (id: number) => findOrThrow(bookings.findById(id), 'Booking')

  const create = async (userId: number, request: CreateBookingRequest): Promise<BookingDto> => {
    const seat = await findOrThrow(seats.findById(request.seatId), 'Seat')
    const room = await findOrThrow(rooms.findById(seat.roomId), 'Room')

    assertWithinBookingWindow(request.bookingDate, today(), room.maxDaysAhead)

    const existing = await bookings.findActiveBySeatAndDate(request.seatId, request.bookingDate)
    if (existing.some((booking) => periodsOverlap(booking.timePeriod, request.timePeriod)))
      throw new ConflictError('Seat is already booked for that period')

    return findBooking(await bookings.create(userId, request))
  }

  const cancel = async (userId: number, bookingId: number): Promise<void> => {
    const booking = await findBooking(bookingId)
    if (booking.userId !== userId) throw new ForbiddenError('You can only cancel your own bookings')
    if (booking.status !== 'ACTIVE')
      throw new ConflictError('Only active bookings can be cancelled')
    await bookings.cancel(bookingId)
  }

  return {
    create,
    cancel,
    findForUser: bookings.findByUserId,
  }
}

export type BookingsService = ReturnType<typeof createBookingsService>
