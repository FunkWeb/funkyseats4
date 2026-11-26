import type { UserDto } from './user.js'

export type BookingStatus = 'ACTIVE' | 'COMPLETE' | 'CANCELLED'

export const TIME_PERIODS = ['BEFORE_LUNCH', 'AFTER_LUNCH', 'ALL_DAY'] as const

export type TimePeriod = (typeof TIME_PERIODS)[number]

export function periodsOverlap(a: TimePeriod, b: TimePeriod): boolean {
  return a === b || a === 'ALL_DAY' || b === 'ALL_DAY'
}

export interface BookingDto {
  id: number
  seatId: number
  userId: number
  status: BookingStatus
  bookingDate: string
  timePeriod: TimePeriod
}

export interface RoomBookingDto extends BookingDto {
  user: Pick<UserDto, 'name' | 'avatarPath'>
}

export type MyBookingDto = BookingDto & {
  roomName: string
  roomSlug: string
  seatNumber: string
}

export type NewBooking = Pick<BookingDto, 'seatId' | 'bookingDate' | 'timePeriod'>

export interface BookingStatsDto {
  upcoming: number
  completed: number
  cancelled: number
  thisMonth: number
  favouriteRoom: { name: string; slug: string; count: number } | null
  favouriteSeat: { seatNumber: string; roomName: string; count: number } | null
  byPeriod: Record<TimePeriod, number>
  perMonth: { month: string; count: number }[]
}
