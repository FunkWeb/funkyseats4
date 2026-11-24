import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SeatWithFeaturesDto } from '../../../../contracts/seat'
import { createSeat, deleteSeat, getRoomSeats, updateSeat } from '../../api/seatsApi'

export const roomSeatsQueryKey = (roomId: number | undefined) => ['rooms', roomId, 'seats'] as const

export interface SaveSeatVariables {
  roomId: number
  seat?: SeatWithFeaturesDto
  seatNumber: string
  description: string | null
  featureIds: number[]
}

export interface DeleteSeatVariables {
  roomId: number
  seatId: number
}

export function useRoomSeats(roomId: number | undefined) {
  return useQuery({
    queryKey: roomSeatsQueryKey(roomId),
    queryFn: roomId === undefined ? skipToken : () => getRoomSeats(roomId),
  })
}

export function useSaveSeat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      roomId,
      seat,
      seatNumber,
      description,
      featureIds,
    }: SaveSeatVariables) => {
      if (seat === undefined) {
        await createSeat({ roomId, seatNumber, description, featureIds })
        return
      }

      await updateSeat(seat.id, { seatNumber, description, featureIds })
    },
    onSettled: async (_data, _error, variables) =>
      queryClient.invalidateQueries({ queryKey: roomSeatsQueryKey(variables.roomId) }),
  })
}

export function useDeleteSeat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ seatId }: DeleteSeatVariables) => deleteSeat(seatId),
    onSettled: async (_data, _error, variables) =>
      queryClient.invalidateQueries({ queryKey: roomSeatsQueryKey(variables.roomId) }),
  })
}
