import type { BookingDto, CreateBookingRequest } from '../../../contracts/booking'
import { get, post } from './httpClient'

export type NewBooking = Omit<CreateBookingRequest, 'userId'>

export function getMyBookings(): Promise<BookingDto[]> {
  return get<BookingDto[]>('/bookings/me')
}

export function createBooking(input: NewBooking): Promise<BookingDto> {
  return post<BookingDto>('/bookings', input)
}

export function cancelBooking(id: number): Promise<void> {
  return post<void>(`/bookings/${id}/cancel`)
}
