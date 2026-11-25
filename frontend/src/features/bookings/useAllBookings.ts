import { useQuery } from '@tanstack/react-query'
import { getAllBookings, type AdminBookingFilters } from '../../api/bookingsApi'

export const allBookingsBaseQueryKey = ['bookings', 'all'] as const

export const allBookingsQueryKey = (filters: AdminBookingFilters, page: number) =>
  [...allBookingsBaseQueryKey, filters, page] as const

export function useAllBookings(filters: AdminBookingFilters, page: number) {
  return useQuery({
    queryKey: allBookingsQueryKey(filters, page),
    queryFn: () => getAllBookings(filters, page),
  })
}
