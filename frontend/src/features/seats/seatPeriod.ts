import { periodsOverlap, type BookingDto, type TimePeriod } from '../../../../contracts/booking'

const INITIAL_PERIOD_ORDER: TimePeriod[] = ['ALL_DAY', 'BEFORE_LUNCH', 'AFTER_LUNCH']

export function getActiveSeatBookings(seatId: number, bookings: BookingDto[]): BookingDto[] {
  return bookings.filter((booking) => booking.seatId === seatId && booking.status === 'ACTIVE')
}

export function isPeriodTaken(
  period: TimePeriod,
  seatBookings: BookingDto[],
  currentUserId: number,
): boolean {
  return seatBookings.some(
    (booking) => booking.userId !== currentUserId && periodsOverlap(booking.timePeriod, period),
  )
}

export function getInitialPeriod(seatBookings: BookingDto[], currentUserId: number): TimePeriod {
  const ownBooking = seatBookings.find((booking) => booking.userId === currentUserId)
  if (ownBooking) return ownBooking.timePeriod

  return (
    INITIAL_PERIOD_ORDER.find((period) => !isPeriodTaken(period, seatBookings, currentUserId)) ??
    'ALL_DAY'
  )
}

export function getPeriodOccupant(
  period: TimePeriod,
  seatBookings: BookingDto[],
  currentUserId: number,
): BookingDto | undefined {
  const overlapping = seatBookings.filter((booking) => periodsOverlap(booking.timePeriod, period))

  return (
    overlapping.find((booking) => booking.userId !== currentUserId) ??
    overlapping.find((booking) => booking.userId === currentUserId)
  )
}
