import { useQuery } from '@tanstack/react-query'
import { getMyBookings } from '../../api/bookingsApi'

export const myBookingsBaseQueryKey = ['bookings', 'me'] as const

export const myBookingsQueryKey = (page: number) => [...myBookingsBaseQueryKey, page] as const

export function useMyBookings(page: number) {
  return useQuery({
    queryKey: myBookingsQueryKey(page),
    queryFn: () => getMyBookings(page),
  })
}
