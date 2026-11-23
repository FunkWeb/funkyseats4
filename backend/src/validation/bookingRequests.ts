import { TIME_PERIODS, type NewBooking } from '../../../contracts/booking.js'
import { asRecord, parseId, parseIsoDate, parseOneOf } from './parsers.js'

export const parseNewBooking = (body: unknown): NewBooking => {
  const { seatId, bookingDate, timePeriod } = asRecord(body)
  return {
    seatId: parseId(seatId, 'seatId'),
    bookingDate: parseIsoDate(bookingDate, 'bookingDate'),
    timePeriod: parseOneOf(TIME_PERIODS, timePeriod, 'timePeriod'),
  }
}
