import {
  BOOKING_STATUSES,
  TIME_PERIODS,
  type BookingFilters,
  type NewBooking,
} from '../../../contracts/booking.js'
import { asRecord, parseId, parseIsoDate, parseOneOf, parseIfPresent } from './parsers.js'

export const parseNewBooking = (body: unknown): NewBooking => {
  const { seatId, bookingDate, timePeriod } = asRecord(body)
  return {
    seatId: parseId(seatId, 'seatId'),
    bookingDate: parseIsoDate(bookingDate, 'bookingDate'),
    timePeriod: parseOneOf(TIME_PERIODS, timePeriod, 'timePeriod'),
  }
}

export const parseAdminBookingFilters = (query: Record<string, unknown>): BookingFilters => ({
  date: parseIfPresent(query.date, (value) => parseIsoDate(value, 'date')),
  roomId: parseIfPresent(query.roomId, (value) => parseId(value, 'roomId')),
  userId: parseIfPresent(query.userId, (value) => parseId(value, 'userId')),
  status: parseIfPresent(query.status, (value) => parseOneOf(BOOKING_STATUSES, value, 'status')),
})
