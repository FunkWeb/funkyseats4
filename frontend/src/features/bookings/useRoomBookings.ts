import { skipToken, useQuery, type Query } from '@tanstack/react-query'
import { getRoomBookings } from '../../api/bookingsApi'

export const roomBookingsQueryKey = (roomId: number | undefined, date: string) =>
  ['rooms', roomId, 'bookings', date] as const

export const isRoomBookingsQuery = ({ queryKey }: Query) =>
  queryKey[0] === 'rooms' && queryKey[2] === 'bookings'

export function useRoomBookings(roomId: number | undefined, date: string) {
  return useQuery({
    queryKey: roomBookingsQueryKey(roomId, date),
    queryFn: roomId === undefined ? skipToken : () => getRoomBookings(roomId, date),
  })
}
