import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SeatWithFeaturesDto } from '../../../../contracts/seat'
import {
  addSeatFeature,
  createSeat,
  deleteSeat,
  getRoomSeats,
  removeSeatFeature,
  updateSeat,
} from '../../api/seatsApi'

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
      const seatId =
        seat === undefined ? (await createSeat({ roomId, seatNumber, description })).id : seat.id

      if (seat !== undefined) {
        await updateSeat(seatId, { seatNumber, description })
      }

      const currentFeatureIds = new Set(seat?.features.map((feature) => feature.id) ?? [])
      const nextFeatureIds = new Set(featureIds)
      const additions = featureIds.filter((featureId) => !currentFeatureIds.has(featureId))
      const removals = [...currentFeatureIds].filter((featureId) => !nextFeatureIds.has(featureId))

      await Promise.all([
        ...additions.map((featureId) => addSeatFeature(seatId, featureId)),
        ...removals.map((featureId) => removeSeatFeature(seatId, featureId)),
      ])
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
