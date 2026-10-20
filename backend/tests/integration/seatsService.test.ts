import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FeatureDto } from '../../../contracts/feature.js'
import type { CreateSeatInput, Seat, UpdateSeatInput } from '../../../contracts/seat.js'
import { NotFoundError } from '../../src/errors/appErrors.js'
import { createSeatsService } from '../../src/services/seatsService.js'

const TEST_TIMESTAMP = '2030-01-01T00:00:00.000Z'

const seatRecord: Seat = {
  id: 1,
  roomId: 1,
  seatNumber: 'A1',
  description: null,
  deletedAt: null,
  updatedAt: TEST_TIMESTAMP,
  createdAt: TEST_TIMESTAMP,
}

const featureRecord: FeatureDto = {
  id: 1,
  name: 'Monitor',
  description: null,
  iconPath: null,
  category: 'HARDWARE',
}

const createService = (options: { roomIds?: number[]; seatExists?: boolean } = {}) => {
  const roomIds = new Set(options.roomIds ?? [1])
  let seatExists = options.seatExists ?? true
  const createdSeats: CreateSeatInput[] = []
  const requestedSeatUpdates: Array<[number, UpdateSeatInput]> = []
  const attachedFeatures: Array<[number, number]> = []
  const detachedFeatures: Array<[number, number]> = []

  const service = createSeatsService({
    seats: {
      findById: async (id) => (seatExists && id === seatRecord.id ? seatRecord : undefined),
      findByRoomId: async (roomId) => (roomIds.has(roomId) ? [seatRecord] : []),
      create: async (input) => {
        createdSeats.push(input)
        return 42
      },
      update: async (seatId, input) => {
        requestedSeatUpdates.push([seatId, input])
        return seatExists
      },
      delete: async (seatId) => {
        if (!seatExists || seatId !== seatRecord.id) return false
        seatExists = false
        return true
      },
    },
    rooms: {
      findById: async (id) =>
        roomIds.has(id)
          ? {
              id,
              slug: 'room',
              name: 'Room',
              description: null,
              seatMapPath: null,
              maxDaysAhead: 10,
              deletedAt: null,
              updatedAt: new Date(TEST_TIMESTAMP),
              createdAt: new Date(TEST_TIMESTAMP),
            }
          : null,
    },
    features: {
      findBySeatId: async () => [featureRecord],
      attachToSeat: async (seatId, featureId) => {
        attachedFeatures.push([seatId, featureId])
      },
      detachFromSeat: async (seatId, featureId) => {
        detachedFeatures.push([seatId, featureId])
        return true
      },
    },
  })

  return { service, createdSeats, requestedSeatUpdates, attachedFeatures, detachedFeatures }
}

describe('seatsService', () => {
  it('findByRoom returns seats after confirming the room exists', async () => {
    const { service } = createService()
    assert.deepEqual(await service.findByRoom(1), [seatRecord])
  })

  it('findByRoom rejects a missing or soft-deleted room', async () => {
    const { service } = createService({ roomIds: [] })
    await assert.rejects(service.findByRoom(1), NotFoundError)
  })

  it('create checks the room and returns the created seat ID', async () => {
    const { service, createdSeats } = createService()
    const input: CreateSeatInput = {
      roomId: 1,
      seatNumber: 'B2',
      description: 'By the window',
    }
    assert.equal(await service.create(input), 42)
    assert.deepEqual(createdSeats, [input])
  })

  it('create rejects a missing or soft-deleted room', async () => {
    const { service } = createService({ roomIds: [] })
    await assert.rejects(
      service.create({ roomId: 2, seatNumber: 'B2', description: null }),
      NotFoundError,
    )
  })

  it('update requires the seat and validates a changed room', async () => {
    const { service, requestedSeatUpdates } = createService()
    await service.update(1, { roomId: 1, seatNumber: 'B2' })
    assert.deepEqual(requestedSeatUpdates, [[1, { roomId: 1, seatNumber: 'B2' }]])

    await assert.rejects(service.update(1, { roomId: 2 }), NotFoundError)
    assert.equal(requestedSeatUpdates.length, 1)
    await assert.rejects(createService({ seatExists: false }).service.update(1, {}), NotFoundError)
  })

  it('delete soft-deletes an existing seat and rejects a missing seat', async () => {
    const { service } = createService()
    await service.delete(1)
    await assert.rejects(service.delete(1), NotFoundError)
  })

  it('findFeatures returns the seat features', async () => {
    const { service } = createService()
    assert.deepEqual(await service.findFeatures(1), [featureRecord])
  })

  it('feature operations reject missing or soft-deleted seats before accessing features', async () => {
    const { service, attachedFeatures, detachedFeatures } = createService({ seatExists: false })
    await assert.rejects(service.findFeatures(1), NotFoundError)
    await assert.rejects(service.attachFeature(1, 2), NotFoundError)
    await assert.rejects(service.detachFeature(1, 2), NotFoundError)
    assert.deepEqual(attachedFeatures, [])
    assert.deepEqual(detachedFeatures, [])
  })

  it('attachFeature and detachFeature operate on an existing seat', async () => {
    const { service, attachedFeatures, detachedFeatures } = createService()
    await service.attachFeature(1, 2)
    await service.detachFeature(1, 2)
    assert.deepEqual(attachedFeatures, [[1, 2]])
    assert.deepEqual(detachedFeatures, [[1, 2]])
  })
})
