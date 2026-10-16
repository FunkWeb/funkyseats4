export interface Seat {
  id: number
  roomId: number
  seatNumber: string
  description: string | null
  deletedAt: string | null
  updatedAt: string
  createdAt: string
}

export type CreateSeatInput = Omit<Seat, 'id' | 'deletedAt' | 'updatedAt' | 'createdAt'>
export type UpdateSeatInput = Partial<CreateSeatInput>
