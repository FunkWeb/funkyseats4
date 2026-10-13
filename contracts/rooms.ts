export interface RoomDto {
  id: number
  slug: string
  name: string
  description: string | null
  seatMapPath: string | null
  maxDaysAhead: number
  updatedAt: string
  createdAt: string
}

export interface CreateRoomRequest {
  slug: string
  name: string
  description?: string | null
  seatMapPath?: string | null
  maxDaysAhead?: number
}

export type UpdateRoomRequest = Partial<CreateRoomRequest>
