import type { CreateRoomRequest, RoomDto, UpdateRoomRequest } from '../../../contracts/room'
import { del, get, patch, post, postFile } from './httpClient'

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

const SEAT_MAP_MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

// Some browsers/OSes report an empty file.type, so fall back to the extension.
function seatMapContentType(file: File): string {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return SEAT_MAP_MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

export function uploadSeatMap(file: File): Promise<{ seatMapPath: string }> {
  return postFile<{ seatMapPath: string }>('/rooms/seat-maps', file, seatMapContentType(file))
}

export function deleteSeatMap(seatMapPath: string): Promise<void> {
  const filename = seatMapPath.split('/').pop() ?? ''
  return del<void>(`/rooms/seat-maps/${encodeURIComponent(filename)}`)
}
