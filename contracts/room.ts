export type RoomDto = {
  id: number
  slug: string
  name: string
  description: string | null
  seatMapPath: string | null
  maxDaysAhead: number
}

export interface CreateRoomRequest {
  slug: string
  name: string
  description?: string | null
  seatMapPath?: string | null
  maxDaysAhead?: number
}

export type UpdateRoomRequest = Partial<CreateRoomRequest>

export const SEAT_MAP_PATH_PATTERN =
  /^\/seat-maps\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/i

export const isValidSeatMapPath = (value: string): boolean => SEAT_MAP_PATH_PATTERN.test(value)
