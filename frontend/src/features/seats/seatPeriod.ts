import { periodsOverlap, type RoomBookingDto, type TimePeriod } from '../../../../contracts/booking'

const INITIAL_PERIOD_ORDER: TimePeriod[] = ['ALL_DAY', 'BEFORE_LUNCH', 'AFTER_LUNCH']

export function getActiveSeatBookings(
  seatId: number,
  bookings: RoomBookingDto[],
): RoomBookingDto[] {
  return bookings.filter((booking) => booking.seatId === seatId && booking.status === 'ACTIVE')
}

export function isPeriodTaken(
  period: TimePeriod,
  seatBookings: RoomBookingDto[],
  currentUserId: number,
): boolean {
  return seatBookings.some(
    (booking) => booking.userId !== currentUserId && periodsOverlap(booking.timePeriod, period),
  )
}

export function getInitialPeriod(
  seatBookings: RoomBookingDto[],
  currentUserId: number,
): TimePeriod {
  const ownBookings = seatBookings.filter((booking) => booking.userId === currentUserId)
  if (ownBookings.length > 1) return 'ALL_DAY'
  if (ownBookings.length === 1) return ownBookings[0].timePeriod

  return (
    INITIAL_PERIOD_ORDER.find((period) => !isPeriodTaken(period, seatBookings, currentUserId)) ??
    'ALL_DAY'
  )
}

export function getOwnPeriodBookings(
  period: TimePeriod,
  seatBookings: RoomBookingDto[],
  currentUserId: number,
): RoomBookingDto[] {
  return seatBookings.filter(
    (booking) => booking.userId === currentUserId && periodsOverlap(booking.timePeriod, period),
  )
}

export function getPeriodOccupant(
  period: TimePeriod,
  seatBookings: RoomBookingDto[],
  currentUserId: number,
): RoomBookingDto | undefined {
  const overlapping = seatBookings.filter((booking) => periodsOverlap(booking.timePeriod, period))

  return (
    overlapping.find((booking) => booking.userId !== currentUserId) ??
    overlapping.find((booking) => booking.userId === currentUserId)
  )
}
