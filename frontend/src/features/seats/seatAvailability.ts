import type { BookingDto, TimePeriod } from '../../../../contracts/booking'

export type SeatAvailabilityStatus = 'yours' | 'booked' | 'partlyBooked' | 'free'

export interface SeatAvailability {
  status: SeatAvailabilityStatus
  availablePeriods: TimePeriod[]
  yourPeriod?: TimePeriod
}

export function getSeatAvailability(
  seatId: number,
  bookings: BookingDto[],
  currentUserId: number,
): SeatAvailability {
  const activeBookings = bookings.filter(
    (booking) => booking.seatId === seatId && booking.status === 'ACTIVE',
  )

  const yourBooking = activeBookings.find((booking) => booking.userId === currentUserId)

  const hasAllDay = activeBookings.some((booking) => booking.timePeriod === 'ALL_DAY')
  const hasBeforeLunch =
    hasAllDay || activeBookings.some((booking) => booking.timePeriod === 'BEFORE_LUNCH')
  const hasAfterLunch =
    hasAllDay || activeBookings.some((booking) => booking.timePeriod === 'AFTER_LUNCH')

  const availablePeriods: TimePeriod[] = []
  if (!hasBeforeLunch) {
    availablePeriods.push('BEFORE_LUNCH')
  }
  if (!hasAfterLunch) {
    availablePeriods.push('AFTER_LUNCH')
  }
  if (!hasBeforeLunch && !hasAfterLunch) {
    availablePeriods.push('ALL_DAY')
  }

  if (yourBooking) {
    return {
      status: 'yours',
      availablePeriods,
      yourPeriod: yourBooking.timePeriod,
    }
  }

  if (activeBookings.length === 0) {
    return {
      status: 'free',
      availablePeriods,
    }
  }

  if (hasBeforeLunch && hasAfterLunch) {
    return {
      status: 'booked',
      availablePeriods,
    }
  }

  return {
    status: 'partlyBooked',
    availablePeriods,
  }
}
