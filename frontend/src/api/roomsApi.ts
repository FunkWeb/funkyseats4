import type { CreateRoomRequest, RoomDto, UpdateRoomRequest } from '../../../contracts/room'
import { del, get, patch, post } from './httpClient'

export function getRooms(): Promise<RoomDto[]> {
  return get<RoomDto[]>('/rooms')
}

export function getRoom(id: number): Promise<RoomDto> {
  return get<RoomDto>(`/rooms/${id}`)
}

export function createRoom(input: CreateRoomRequest): Promise<{ id: number }> {
  return post<{ id: number }>('/rooms', input)
}

export function updateRoom(id: number, input: UpdateRoomRequest): Promise<void> {
  return patch<void>(`/rooms/${id}`, input)
}

export function deleteRoom(id: number): Promise<void> {
  return del<void>(`/rooms/${id}`)
}
