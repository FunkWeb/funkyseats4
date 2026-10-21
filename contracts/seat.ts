export interface SeatDto {
  id: number
  roomId: number
  seatNumber: string
  description: string | null
  deletedAt: string | null
  updatedAt: string
  createdAt: string
}

export type CreateSeatRequest = Omit<SeatDto, 'id' | 'deletedAt' | 'updatedAt' | 'createdAt'>
export type UpdateSeatRequest = Partial<CreateSeatRequest>
