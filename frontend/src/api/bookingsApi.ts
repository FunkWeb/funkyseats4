import type { BookingDto, MyBookingDto, NewBooking } from '../../../contracts/booking'
import type { PaginatedResponse } from '../../../contracts/pagination'
import { get, post } from './httpClient'

export function getMyBookings(page: number): Promise<PaginatedResponse<MyBookingDto>> {
  return get<PaginatedResponse<MyBookingDto>>(`/bookings/me?page=${page}`)
}

export function getRoomBookings(roomId: number, date: string): Promise<BookingDto[]> {
  return get<BookingDto[]>(`/rooms/${roomId}/bookings?date=${encodeURIComponent(date)}`)
}

export function createBooking(input: NewBooking): Promise<BookingDto> {
  return post<BookingDto>('/bookings', input)
}

export function cancelBooking(id: number): Promise<void> {
  return post<void>(`/bookings/${id}/cancel`)
}
