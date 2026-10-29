export type BookingStatus = 'ACTIVE' | 'COMPLETE' | 'CANCELLED'

export const TIME_PERIODS = ['BEFORE_LUNCH', 'AFTER_LUNCH', 'ALL_DAY'] as const

export type TimePeriod = (typeof TIME_PERIODS)[number]

export interface BookingDto {
  id: number
  seatId: number
  userId: number
  status: BookingStatus
  bookingDate: string
  timePeriod: TimePeriod
}

export type CreateBookingRequest = Pick<
  BookingDto,
  'seatId' | 'userId' | 'bookingDate' | 'timePeriod'
>
