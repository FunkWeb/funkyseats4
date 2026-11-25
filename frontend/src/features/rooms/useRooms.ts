import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateRoomRequest } from '../../../../contracts/room'
import { createRoom, deleteRoom, getRooms, updateRoom, uploadSeatMap } from '../../api/roomsApi'

export const roomsQueryKey = ['rooms'] as const

export interface SaveRoomVariables {
  roomId?: number
  input: CreateRoomRequest
  seatMapFile?: File | null
}

export function useRooms() {
  return useQuery({ queryKey: roomsQueryKey, queryFn: getRooms })
}

export function useSaveRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, input, seatMapFile }: SaveRoomVariables) => {
      let seatMapPath = input.seatMapPath
      if (seatMapFile) {
        const uploaded = await uploadSeatMap(seatMapFile)
        seatMapPath = uploaded.seatMapPath
      }

      const payload: CreateRoomRequest = {
        ...input,
        seatMapPath: seatMapPath ?? null,
      }

      if (roomId === undefined) {
        await createRoom(payload)
        return
      }
      await updateRoom(roomId, payload)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomsQueryKey }),
  })
}
