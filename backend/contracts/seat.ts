export interface Seat {
  id: number
  room_id: number
  seat_number: string
  description: string | null
  deleted_at: string | null
  updated_at: string
  created_at: string
}

export type CreateSeatInput = Omit<Seat, 'id' | 'deleted_at' | 'updated_at' | 'created_at'>
export type UpdateSeatInput = Partial<CreateSeatInput>
