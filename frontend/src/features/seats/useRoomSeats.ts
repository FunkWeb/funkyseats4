import { skipToken, useQuery } from '@tanstack/react-query'
import { getRoomSeats } from '../../api/seatsApi'

export function useRoomSeats(roomId: number | undefined) {
  return useQuery({
    queryKey: ['rooms', roomId, 'seats'],
    queryFn: roomId === undefined ? skipToken : () => getRoomSeats(roomId),
  })
}
