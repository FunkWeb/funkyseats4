import { useQuery } from '@tanstack/react-query'
import { getMyBookingStats } from '../../api/bookingsApi'
import { myBookingsBaseQueryKey } from './useMyBookings'

export const myBookingStatsQueryKey = [...myBookingsBaseQueryKey, 'stats'] as const

export function useMyBookingStats() {
  return useQuery({
    queryKey: myBookingStatsQueryKey,
    queryFn: getMyBookingStats,
  })
}
