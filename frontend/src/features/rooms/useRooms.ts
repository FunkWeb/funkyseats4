import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateRoomRequest } from '../../../../contracts/room'
import {
  createRoom,
  deleteRoom,
  deleteSeatMap,
  getRooms,
  updateRoom,
  uploadSeatMap,
} from '../../api/roomsApi'

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
      const uploadedPath = seatMapFile ? (await uploadSeatMap(seatMapFile)).seatMapPath : null

      const payload: CreateRoomRequest = {
        ...input,
        seatMapPath: uploadedPath ?? input.seatMapPath ?? null,
      }

      try {
        if (roomId === undefined) {
          await createRoom(payload)
        } else {
          await updateRoom(roomId, payload)
        }
      } catch (error) {
        // The room was not saved, so the new upload is unused; discard it best-effort.
        if (uploadedPath) await deleteSeatMap(uploadedPath).catch(() => undefined)
        throw error
      }
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
