import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateRoomRequest } from '../../../../contracts/room'
import { createRoom, deleteRoom, getRooms, updateRoom } from '../../api/roomsApi'

export const roomsQueryKey = ['rooms'] as const

export interface SaveRoomVariables {
  roomId?: number
  input: CreateRoomRequest
}

export function useRooms() {
  return useQuery({ queryKey: roomsQueryKey, queryFn: getRooms })
}

export function useSaveRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, input }: SaveRoomVariables) => {
      if (roomId === undefined) {
        await createRoom(input)
        return
      }
      await updateRoom(roomId, input)
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
