import type { FeatureDto } from '../../../contracts/feature.js'
import type { CreateSeatInput, Seat, UpdateSeatInput } from '../../../contracts/seat.js'
import { NotFoundError } from '../errors/appErrors.js'
import type { FeaturesRepository } from '../repositories/featuresRepository.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import type { SeatsRepository } from '../repositories/seatsRepository.js'
import { findOrThrow } from './common.js'

export interface SeatsServiceDeps {
  seats: Pick<SeatsRepository, 'findById' | 'findByRoomId' | 'create' | 'update' | 'delete'>
  rooms: Pick<RoomsRepository, 'findById'>
  features: Pick<FeaturesRepository, 'findBySeatId' | 'attachToSeat' | 'detachFromSeat'>
}

export const createSeatsService = ({ seats, rooms, features }: SeatsServiceDeps) => {
  const findSeat = (seatId: number) => findOrThrow(seats.findById(seatId), 'Seat')
  const findRoom = (roomId: number) => findOrThrow(rooms.findById(roomId), 'Room')

  const findByRoom = async (roomId: number): Promise<Seat[]> => {
    await findRoom(roomId)
    return seats.findByRoomId(roomId)
  }

  const create = async (input: CreateSeatInput): Promise<number> => {
    await findRoom(input.roomId)
    return seats.create(input)
  }

  const update = async (seatId: number, input: UpdateSeatInput): Promise<void> => {
    await findSeat(seatId)
    if (input.roomId !== undefined) await findRoom(input.roomId)

    const updated = await seats.update(seatId, input)
    if (!updated && Object.values(input).some((value) => value !== undefined))
      throw new NotFoundError('Seat')
  }

  const remove = async (seatId: number): Promise<void> => {
    if (!(await seats.delete(seatId))) throw new NotFoundError('Seat')
  }

  const findFeatures = async (seatId: number): Promise<FeatureDto[]> => {
    await findSeat(seatId)
    return features.findBySeatId(seatId)
  }

  const attachFeature = async (seatId: number, featureId: number): Promise<void> => {
    await findSeat(seatId)
    await features.attachToSeat(seatId, featureId)
  }

  const detachFeature = async (seatId: number, featureId: number): Promise<void> => {
    await findSeat(seatId)
    await features.detachFromSeat(seatId, featureId)
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
