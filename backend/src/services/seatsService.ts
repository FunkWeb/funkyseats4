import type { FeatureDto } from '../../../contracts/feature.js'
import type { CreateSeatInput, Seat, UpdateSeatInput } from '../../../contracts/seat.js'
import { ConflictError, NotFoundError } from '../errors/appErrors.js'
import type { FeaturesRepository } from '../repositories/featuresRepository.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import type { SeatsRepository } from '../repositories/seatsRepository.js'
import { findOrThrow } from './common.js'

export interface SeatsServiceDeps {
  seats: Pick<SeatsRepository, 'findById' | 'findByRoomId' | 'create' | 'update' | 'delete'>
  rooms: Pick<RoomsRepository, 'findById'>
  features: Pick<
    FeaturesRepository,
    'findById' | 'findBySeatId' | 'attachToSeat' | 'detachFromSeat'
  >
}

export const createSeatsService = ({ seats, rooms, features }: SeatsServiceDeps) => {
  const findSeat = (seatId: number) => findOrThrow(seats.findById(seatId), 'Seat')
  const findRoom = (roomId: number) => findOrThrow(rooms.findById(roomId), 'Room')
  const findFeature = (featureId: number) => findOrThrow(features.findById(featureId), 'Feature')

  const assertSeatNumberFree = async (
    roomId: number,
    seatNumber: string,
    exceptSeatId?: number,
  ) => {
    const roomSeats = await seats.findByRoomId(roomId)
    if (roomSeats.some((seat) => seat.seatNumber === seatNumber && seat.id !== exceptSeatId))
      throw new ConflictError(`Seat ${seatNumber} already exists in this room`)
  }

  const findByRoom = async (roomId: number): Promise<Seat[]> => {
    await findRoom(roomId)
    await findRoom(roomId)
    return seats.findByRoomId(roomId)
  }

  const create = async (input: CreateSeatInput): Promise<number> => {
    await findRoom(input.roomId)
    await assertSeatNumberFree(input.roomId, input.seatNumber)
    return seats.create(input)
  }

  const update = async (seatId: number, input: UpdateSeatInput): Promise<void> => {
    const seat = await findSeat(seatId)
    const roomId = input.roomId ?? seat.roomId
    const seatNumber = input.seatNumber ?? seat.seatNumber

    if (input.roomId !== undefined) await findRoom(roomId)
    if (input.roomId !== undefined || input.seatNumber !== undefined)
      await assertSeatNumberFree(roomId, seatNumber, seatId)

    await seats.update(seatId, input)
  }

  const remove = async (seatId: number): Promise<void> => {
    if (!(await seats.delete(seatId))) throw new NotFoundError('Seat')
  }

  const findFeatures = async (seatId: number): Promise<FeatureDto[]> => {
    await findSeat(seatId)
    await findSeat(seatId)
    return features.findBySeatId(seatId)
  }

  const attachFeature = async (seatId: number, featureId: number): Promise<void> => {
    await Promise.all([findSeat(seatId), findFeature(featureId)])
    const attached = await features.findBySeatId(seatId)
    if (attached.some((feature) => feature.id === featureId))
      throw new ConflictError('Feature is already attached to this seat')
    await features.attachToSeat(seatId, featureId)
  }

  const detachFeature = async (seatId: number, featureId: number): Promise<void> => {
    await findSeat(seatId)
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
