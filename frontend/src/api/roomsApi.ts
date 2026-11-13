import type { CreateRoomRequest, RoomDto, UpdateRoomRequest } from '../../../contracts/room'
import { del, get, patch, post } from './httpClient'

export function getRooms() {
  return get<RoomDto[]>('/rooms')
}

export function getRoom(id: number) {
  return get<RoomDto>(`/rooms/${id}`)
}

export function createRoom(input: CreateRoomRequest) {
  return post<{ id: number }>('/rooms', input)
}

export function updateRoom(id: number, input: UpdateRoomRequest) {
  return patch<void>(`/rooms/${id}`, input)
}

export function deleteRoom(id: number) {
  return del<void>(`/rooms/${id}`)
}
