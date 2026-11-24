import { useQuery } from '@tanstack/react-query'
import { getMyBookings } from '../../api/bookingsApi'

export const myBookingsQueryKey = (page: number) => ['bookings', 'me', page] as const

export function useMyBookings(page: number) {
  return useQuery({
    queryKey: myBookingsQueryKey(page),
    queryFn: () => getMyBookings(page),
  })
}
