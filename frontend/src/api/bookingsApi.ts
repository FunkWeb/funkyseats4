import type {
  AdminBookingDto,
  BookingDto,
  BookingFilters,
  MyBookingDto,
  NewBooking,
  RoomBookingDto,
} from '../../../contracts/booking'
import type { PaginatedResponse } from '../../../contracts/pagination'
import { get, post } from './httpClient'

export function getMyBookings(page: number): Promise<PaginatedResponse<MyBookingDto>> {
  return get<PaginatedResponse<MyBookingDto>>(`/bookings/me?page=${page}`)
}

export function getAllBookings(
  filters: BookingFilters,
  page: number,
): Promise<PaginatedResponse<AdminBookingDto>> {
  const params = new URLSearchParams({ page: String(page) })
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return get<PaginatedResponse<AdminBookingDto>>(`/bookings?${params}`)
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
