import type { FeatureDto } from '../../../contracts/feature.js'
import type { CreateSeatInput, Seat, UpdateSeatInput } from '../../../contracts/seat.js'
import type { FeaturesRepository } from '../repositories/featuresRepository.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import type { SeatsRepository } from '../repositories/seatsRepository.js'

export interface SeatsServiceDeps {
  seats: Pick<SeatsRepository, 'findById' | 'findByRoomId' | 'create' | 'update' | 'delete'>
  rooms: Pick<RoomsRepository, 'findById'>
  features: Pick<FeaturesRepository, 'findBySeatId' | 'attachToSeat' | 'detachFromSeat'>
}

export const createSeatsService = (_deps: SeatsServiceDeps) => {
  const findByRoom = async (_roomId: number): Promise<Seat[]> => {
    throw new Error('Not implemented')
  }

  const create = async (_input: CreateSeatInput): Promise<number> => {
    throw new Error('Not implemented')
  }

  const update = async (_seatId: number, _input: UpdateSeatInput): Promise<void> => {
    throw new Error('Not implemented')
  }

  const remove = async (_seatId: number): Promise<void> => {
    throw new Error('Not implemented')
  }

  const findFeatures = async (_seatId: number): Promise<FeatureDto[]> => {
    throw new Error('Not implemented')
  }

  const attachFeature = async (_seatId: number, _featureId: number): Promise<void> => {
    throw new Error('Not implemented')
  }

  const detachFeature = async (_seatId: number, _featureId: number): Promise<void> => {
    throw new Error('Not implemented')
  }

  return {
    findByRoom,
    create,
    update,
    delete: remove,
    findFeatures,
    attachFeature,
    detachFeature,
  }
}

export type SeatsService = ReturnType<typeof createSeatsService>
