import type { BookingDto, NewBooking, RoomBookingDto } from '../../../contracts/booking'
import { get, post } from './httpClient'

export function getMyBookings(): Promise<BookingDto[]> {
  return get<BookingDto[]>('/bookings/me')
}

export function getRoomBookings(roomId: number, date: string): Promise<RoomBookingDto[]> {
  return get<RoomBookingDto[]>(`/rooms/${roomId}/bookings?date=${encodeURIComponent(date)}`)
}

export function createBooking(input: NewBooking): Promise<BookingDto> {
  return post<BookingDto>('/bookings', input)
}

export function cancelBooking(id: number): Promise<void> {
  return post<void>(`/bookings/${id}/cancel`)
}
