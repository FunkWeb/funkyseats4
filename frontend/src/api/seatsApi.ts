import type { FeatureDto } from '../../../contracts/feature.js'
import type { CreateSeatRequest, SeatDto, UpdateSeatRequest } from '../../../contracts/seat.js'
import { del, get, patch, post, put } from './httpClient.js'

export function getRoomSeats(roomId: number): Promise<SeatDto[]> {
  return get<SeatDto[]>(`/rooms/${roomId}/seats`)
}

export function createSeat(input: CreateSeatRequest): Promise<{ id: number }> {
  return post<{ id: number }>('/seats', input)
}

export function updateSeat(id: number, input: UpdateSeatRequest): Promise<void> {
  return patch<void>(`/seats/${id}`, input)
}

export function deleteSeat(id: number): Promise<void> {
  return del<void>(`/seats/${id}`)
}

export function getSeatFeatures(seatId: number): Promise<FeatureDto[]> {
  return get<FeatureDto[]>(`/seats/${seatId}/features`)
}

export function addSeatFeature(seatId: number, featureId: number): Promise<void> {
  return put<void>(`/seats/${seatId}/features/${featureId}`)
}

export function removeSeatFeature(seatId: number, featureId: number): Promise<void> {
  return del<void>(`/seats/${seatId}/features/${featureId}`)
}
