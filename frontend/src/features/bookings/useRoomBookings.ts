import { skipToken, useQuery } from '@tanstack/react-query'
import { getRoomBookings } from '../../api/bookingsApi'

export const roomBookingsQueryKey = (roomId: number | undefined, date: string) =>
  ['rooms', roomId, 'bookings', date] as const

export function useRoomBookings(roomId: number | undefined, date: string) {
  return useQuery({
    queryKey: roomBookingsQueryKey(roomId, date),
    queryFn: roomId === undefined ? skipToken : () => getRoomBookings(roomId, date),
  })
}
