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

interface SeatTransaction {
  seats: Pick<SeatsRepository, 'lockById' | 'create' | 'update'>
  features: Pick<FeaturesRepository, 'attachToSeat' | 'detachAllFromSeat'>
}

const hasErrorCode = (error: unknown, code: string) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code

const rethrowAs =
  (code: string, toError: () => Error) =>
  (error: unknown): never => {
    throw hasErrorCode(error, code) ? toError() : error
  }

const seatNumberTaken = (seatNumber: string) =>
  new ConflictError(`Seat ${seatNumber} already exists in this room`)

const attachFeatures = async (tx: SeatTransaction, seatId: number, featureIds: number[]) => {
  for (const featureId of featureIds) {
    await tx.features
      .attachToSeat(seatId, featureId)
      .catch(rethrowAs('ER_NO_REFERENCED_ROW_2', () => new NotFoundError('Feature')))
  }
}

export const createSeatsService = ({ db, seats, rooms, features }: SeatsServiceDeps) => {
  const findSeat = (seatId: number) => findOrThrow(seats.findById(seatId), 'Seat')
  const findRoom = (roomId: number) => findOrThrow(rooms.findById(roomId), 'Room')
  const findFeature = (featureId: number) => findOrThrow(features.findById(featureId), 'Feature')

  const assertFeaturesExist = async (featureIds: number[]) => {
    await Promise.all(featureIds.map((featureId) => findFeature(featureId)))
  }

  const withTransaction = async <T>(run: (tx: SeatTransaction) => Promise<T>): Promise<T> => {
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
      throw seatNumberTaken(seatNumber)
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
      const seatId = await tx.seats
        .create(input)
        .catch(rethrowAs('ER_DUP_ENTRY', () => seatNumberTaken(input.seatNumber)))
      await attachFeatures(tx, seatId, input.featureIds)
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
      if (!(await tx.seats.lockById(seatId))) throw new NotFoundError('Seat')
      await tx.seats
        .update(seatId, input)
        .catch(rethrowAs('ER_DUP_ENTRY', () => seatNumberTaken(seatNumber)))
      if (input.featureIds !== undefined) {
        await tx.features.detachAllFromSeat(seatId)
        await attachFeatures(tx, seatId, input.featureIds)
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
