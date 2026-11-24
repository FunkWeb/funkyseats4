import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NotFoundError } from '../../src/errors/appErrors.js'
import {
  createFeaturesRepository,
  type FeaturesRepository,
} from '../../src/repositories/featuresRepository.js'
import { createRoomsRepository } from '../../src/repositories/roomsRepository.js'
import {
  createSeatsRepository,
  type SeatsRepository,
} from '../../src/repositories/seatsRepository.js'
import { createSeatsService, type SeatsService } from '../../src/services/seatsService.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, dock, linux, type Fixtures } from '../testFixtures.js'

const UNKNOWN_ID = 0

describe('seatsService', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let features: FeaturesRepository
  let seats: SeatsRepository
  let service: SeatsService
  let featureQueries: number
  let roomId: number

  const storeSeat = (seatNumber: string) => fixtures.storeSeat(roomId, seatNumber)

  before(() => {
    fixtures = createFixtures(db())
    features = createFeaturesRepository(db())
    seats = createSeatsRepository(db())
    service = createSeatsService({
      db: db(),
      seats,
      rooms: createRoomsRepository(db()),
      features: {
        ...features,
        findBySeatId: (seatId) => {
          featureQueries++
          return features.findBySeatId(seatId)
        },
        findByRoomId: (id) => {
          featureQueries++
          return features.findByRoomId(id)
        },
      },
    })
  })

  beforeEach(async () => {
    await fixtures.reset()
    featureQueries = 0
    roomId = await fixtures.storeRoom('room-a')
  })

  it('findByRoom attaches each seat’s own features, ordered by name', async () => {
    const [seatA, seatB, seatC] = [
      await storeSeat('A1'),
      await storeSeat('A2'),
      await storeSeat('A3'),
    ]
    const [storedDock, storedLinux] = [
      await fixtures.storeFeature(dock),
      await fixtures.storeFeature(linux),
    ]
    await features.attachToSeat(seatA, storedLinux.id)
    await features.attachToSeat(seatA, storedDock.id)
    await features.attachToSeat(seatB, storedLinux.id)

    const found = await service.findByRoom(roomId)

    assert.deepEqual(
      found.map(({ id, features }) => ({ id, features })),
      [
        { id: seatA, features: [storedDock, storedLinux] },
        { id: seatB, features: [storedLinux] },
        { id: seatC, features: [] },
      ],
    )
  })

  it('findByRoom keeps the seat fields and seat number order', async () => {
    const seatB = await storeSeat('A2')
    const seatA = await storeSeat('A1')

    const found = await service.findByRoom(roomId)

    assert.deepEqual(found, [
      { ...(await seats.findById(seatA)), features: [] },
      { ...(await seats.findById(seatB)), features: [] },
    ])
  })

  it('findByRoom fetches features with one query for the whole room', async () => {
    const stored = await fixtures.storeFeature(dock)
    for (const seatNumber of ['A1', 'A2', 'A3']) {
      await features.attachToSeat(await storeSeat(seatNumber), stored.id)
    }

    await service.findByRoom(roomId)

    assert.equal(featureQueries, 1)
  })

  it('findByRoom leaves out soft-deleted seats', async () => {
    const [seatA, seatB] = [await storeSeat('A1'), await storeSeat('A2')]
    const stored = await fixtures.storeFeature(dock)
    await features.attachToSeat(seatA, stored.id)
    await features.attachToSeat(seatB, stored.id)
    await seats.delete(seatB)

    const found = await service.findByRoom(roomId)

    assert.deepEqual(
      found.map(({ id, features }) => ({ id, features })),
      [{ id: seatA, features: [stored] }],
    )
  })

  it('findByRoom rejects an unknown room', async () => {
    await assert.rejects(service.findByRoom(UNKNOWN_ID), NotFoundError)
  })

  it('findFeatures still returns a single seat’s features', async () => {
    const seatId = await storeSeat('A1')
    const stored = await fixtures.storeFeature(dock)
    await features.attachToSeat(seatId, stored.id)

    assert.deepEqual(await service.findFeatures(seatId), [stored])
  })

  it('create saves the seat and its features together', async () => {
    const [storedDock, storedLinux] = [
      await fixtures.storeFeature(dock),
      await fixtures.storeFeature(linux),
    ]

    const seatId = await service.create({
      roomId,
      seatNumber: 'A1',
      description: 'By the window',
      featureIds: [storedLinux.id, storedDock.id],
    })

    const saved = await seats.findById(seatId)
    assert.equal(saved?.seatNumber, 'A1')
    assert.equal(saved?.description, 'By the window')
    assert.deepEqual(await features.findBySeatId(seatId), [storedDock, storedLinux])
  })

  it('create rejects an unknown feature id without creating the seat', async () => {
    const storedDock = await fixtures.storeFeature(dock)

    await assert.rejects(
      service.create({
        roomId,
        seatNumber: 'A1',
        description: null,
        featureIds: [storedDock.id, UNKNOWN_ID],
      }),
      NotFoundError,
    )

    assert.deepEqual(await seats.findByRoomId(roomId), [])
  })

  it('create rolls back the seat if saving features fails', async () => {
    const storedDock = await fixtures.storeFeature(dock)
    const realPool = db()
    const failingService = createSeatsService({
      db: {
        getConnection: async () => {
          const connection = await realPool.getConnection()
          const originalExecute = connection.execute.bind(connection)
          connection.execute = ((sql: string, params?: unknown) => {
            if (typeof sql === 'string' && sql.includes('INSERT INTO seat_features')) {
              return Promise.reject(new Error('Simulated feature insert failure'))
            }
            return originalExecute(sql, params as never)
          }) as typeof connection.execute
          return connection
        },
      },
      seats,
      rooms: createRoomsRepository(realPool),
      features,
    })

    await assert.rejects(
      failingService.create({
        roomId,
        seatNumber: 'A1',
        description: null,
        featureIds: [storedDock.id],
      }),
      /Simulated feature insert failure/,
    )

    assert.deepEqual(await seats.findByRoomId(roomId), [])
  })

  it('update with featureIds replaces the seat’s features with that exact list', async () => {
    const [storedDock, storedLinux] = [
      await fixtures.storeFeature(dock),
      await fixtures.storeFeature(linux),
    ]
    const seatId = await service.create({
      roomId,
      seatNumber: 'A1',
      description: null,
      featureIds: [storedDock.id],
    })

    await service.update(seatId, {
      seatNumber: 'A2',
      featureIds: [storedLinux.id],
    })

    const updated = await seats.findById(seatId)
    assert.equal(updated?.seatNumber, 'A2')
    assert.deepEqual(await features.findBySeatId(seatId), [storedLinux])
  })

  it('update without featureIds leaves existing features unchanged', async () => {
    const storedDock = await fixtures.storeFeature(dock)
    const seatId = await service.create({
      roomId,
      seatNumber: 'A1',
      description: 'Old',
      featureIds: [storedDock.id],
    })

    await service.update(seatId, { description: 'New' })

    const updated = await seats.findById(seatId)
    assert.equal(updated?.description, 'New')
    assert.deepEqual(await features.findBySeatId(seatId), [storedDock])
  })

  it('update rejects an unknown feature id without changing the seat or its features', async () => {
    const storedDock = await fixtures.storeFeature(dock)
    const seatId = await service.create({
      roomId,
      seatNumber: 'A1',
      description: 'Original',
      featureIds: [storedDock.id],
    })

    await assert.rejects(
      service.update(seatId, {
        seatNumber: 'A9',
        featureIds: [UNKNOWN_ID],
      }),
      NotFoundError,
    )

    const unchanged = await seats.findById(seatId)
    assert.equal(unchanged?.seatNumber, 'A1')
    assert.deepEqual(await features.findBySeatId(seatId), [storedDock])
  })
})
