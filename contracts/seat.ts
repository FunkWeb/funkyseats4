import type { FeatureDto } from './feature.js'

export interface SeatDto {
  id: number
  roomId: number
  seatNumber: string
  description: string | null
  deletedAt: string | null
  updatedAt: string
  createdAt: string
}

export type CreateSeatRequest = Omit<SeatDto, 'id' | 'deletedAt' | 'updatedAt' | 'createdAt'> & {
  featureIds: number[]
}
export type UpdateSeatRequest = Partial<CreateSeatRequest>

export type SeatWithFeaturesDto = SeatDto & { features: FeatureDto[] }
