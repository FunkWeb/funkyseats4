import type { Pool, PoolConnection } from 'mysql2/promise'
import type { FeatureDto } from '../../../contracts/feature.js'
import type {
  CreateSeatRequest,
  SeatWithFeaturesDto,
  UpdateSeatRequest,
} from '../../../contracts/seat.js'
import { ConflictError, NotFoundError } from '../errors/appErrors.js'
import {
  createFeaturesRepository,
  type FeaturesRepository,
} from '../repositories/featuresRepository.js'
import type { RoomsRepository } from '../repositories/roomsRepository.js'
import { createSeatsRepository, type SeatsRepository } from '../repositories/seatsRepository.js'
import { findOrThrow } from './common.js'

export interface SeatsServiceDeps {
  db: Pick<Pool, 'getConnection'>
  seats: Pick<SeatsRepository, 'findById' | 'findByRoomId' | 'create' | 'update' | 'delete'>
  rooms: Pick<RoomsRepository, 'findById'>
  features: Pick<
    FeaturesRepository,
    | 'findById'
    | 'findBySeatId'
    | 'findByRoomId'
    | 'attachToSeat'
    | 'detachFromSeat'
    | 'detachAllFromSeat'
  >
}

export const createSeatsService = ({ db, seats, rooms, features }: SeatsServiceDeps) => {
  const findSeat = (seatId: number) => findOrThrow(seats.findById(seatId), 'Seat')
  const findRoom = (roomId: number) => findOrThrow(rooms.findById(roomId), 'Room')
  const findFeature = (featureId: number) => findOrThrow(features.findById(featureId), 'Feature')

  const assertFeaturesExist = async (featureIds: number[]) => {
    await Promise.all(featureIds.map((featureId) => findFeature(featureId)))
  }

  const withTransaction = async <T>(
    run: (tx: {
      seats: Pick<SeatsRepository, 'create' | 'update'>
      features: Pick<FeaturesRepository, 'attachToSeat' | 'detachAllFromSeat'>
    }) => Promise<T>,
  ): Promise<T> => {
    const connection: PoolConnection = await db.getConnection()
    try {
      await connection.beginTransaction()
      const result = await run({
        seats: createSeatsRepository(connection),
        features: createFeaturesRepository(connection),
      })
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  const assertSeatNumberFree = async (
    roomId: number,
    seatNumber: string,
    exceptSeatId?: number,
  ) => {
    const roomSeats = await seats.findByRoomId(roomId)
    if (roomSeats.some((seat) => seat.seatNumber === seatNumber && seat.id !== exceptSeatId)) {
      throw new ConflictError(`Seat ${seatNumber} already exists in this room`)
    }
  }

  const findByRoom = async (roomId: number): Promise<SeatWithFeaturesDto[]> => {
    await findRoom(roomId)
    const [roomSeats, roomFeatures] = await Promise.all([
      seats.findByRoomId(roomId),
      features.findByRoomId(roomId),
    ])

    const featuresBySeat = new Map<number, FeatureDto[]>()
    for (const { seatId, ...feature } of roomFeatures) {
      const seatFeatures = featuresBySeat.get(seatId) ?? []
      seatFeatures.push(feature)
      featuresBySeat.set(seatId, seatFeatures)
    }

    return roomSeats.map((seat) => ({ ...seat, features: featuresBySeat.get(seat.id) ?? [] }))
  }

  const create = async (input: CreateSeatRequest): Promise<number> => {
    await findRoom(input.roomId)
    await assertSeatNumberFree(input.roomId, input.seatNumber)
    await assertFeaturesExist(input.featureIds)

    return withTransaction(async (tx) => {
      const seatId = await tx.seats.create(input)
      for (const featureId of input.featureIds) {
        await tx.features.attachToSeat(seatId, featureId)
      }
      return seatId
    })
  }

  const update = async (seatId: number, input: UpdateSeatRequest): Promise<void> => {
    const seat = await findSeat(seatId)
    const roomId = input.roomId ?? seat.roomId
    const seatNumber = input.seatNumber ?? seat.seatNumber

    if (input.roomId !== undefined) await findRoom(roomId)
    if (input.roomId !== undefined || input.seatNumber !== undefined) {
      await assertSeatNumberFree(roomId, seatNumber, seatId)
    }
    if (input.featureIds !== undefined) {
      await assertFeaturesExist(input.featureIds)
    }

    await withTransaction(async (tx) => {
      await tx.seats.update(seatId, input)
      if (input.featureIds !== undefined) {
        await tx.features.detachAllFromSeat(seatId)
        for (const featureId of input.featureIds) {
          await tx.features.attachToSeat(seatId, featureId)
        }
      }
    })
  }

  const remove = async (seatId: number): Promise<void> => {
    if (!(await seats.delete(seatId))) throw new NotFoundError('Seat')
  }

  const findFeatures = async (seatId: number): Promise<FeatureDto[]> => {
    await findSeat(seatId)
    return features.findBySeatId(seatId)
  }

  const attachFeature = async (seatId: number, featureId: number): Promise<void> => {
    await Promise.all([findSeat(seatId), findFeature(featureId)])
    const attached = await features.findBySeatId(seatId)
    if (attached.some((feature) => feature.id === featureId)) {
      throw new ConflictError('Feature is already attached to this seat')
    }
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
