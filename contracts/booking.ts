export type BookingStatus = 'ACTIVE' | 'COMPLETE' | 'CANCELLED'

export type TimePeriod = 'BEFORE_LUNCH' | 'AFTER_LUNCH' | 'ALL_DAY'

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
