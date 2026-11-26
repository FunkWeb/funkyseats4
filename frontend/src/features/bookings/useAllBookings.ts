import { useQuery } from '@tanstack/react-query'
import type { BookingFilters } from '../../../../contracts/booking'
import { getAllBookings } from '../../api/bookingsApi'

export const allBookingsBaseQueryKey = ['bookings', 'all'] as const

export const allBookingsQueryKey = (filters: BookingFilters, page: number) =>
  [...allBookingsBaseQueryKey, filters, page] as const

export function useAllBookings(filters: BookingFilters, page: number) {
  return useQuery({
    queryKey: allBookingsQueryKey(filters, page),
    queryFn: () => getAllBookings(filters, page),
  })
}
