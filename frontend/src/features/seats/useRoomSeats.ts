import { skipToken, useQuery } from '@tanstack/react-query'
import { getRoomSeats } from '../../api/seatsApi'

export const roomSeatsQueryKey = (roomId: number | undefined) => ['rooms', roomId, 'seats'] as const

export function useRoomSeats(roomId: number | undefined) {
  return useQuery({
    queryKey: roomSeatsQueryKey(roomId),
    queryFn: roomId === undefined ? skipToken : () => getRoomSeats(roomId),
  })
}
