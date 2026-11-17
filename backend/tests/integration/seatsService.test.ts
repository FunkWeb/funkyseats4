import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { CreateFeatureRequest, FeatureDto } from '../../../contracts/feature.js'
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
import { createFixtures, type Fixtures } from '../testFixtures.js'

const UNKNOWN_ID = 0

const dock: CreateFeatureRequest = {
  name: 'Docking station',
  description: null,
  iconPath: '/icons/dock.svg',
  category: 'HARDWARE',
}

const linux: CreateFeatureRequest = {
  name: 'Linux',
  description: null,
  iconPath: null,
  category: 'OS',
}

describe('seatsService', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let features: FeaturesRepository
  let seats: SeatsRepository
  let service: SeatsService
  let featureQueries: number
  let roomId: number

  const store = async (feature: CreateFeatureRequest): Promise<FeatureDto> => ({
    ...feature,
    id: await features.create(feature),
  })

  const storeSeat = (seatNumber: string) => fixtures.storeSeat(roomId, seatNumber)

  before(() => {
    fixtures = createFixtures(db())
    features = createFeaturesRepository(db())
    seats = createSeatsRepository(db())
    service = createSeatsService({
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
    const [storedDock, storedLinux] = [await store(dock), await store(linux)]
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
    const stored = await store(dock)
    for (const seatNumber of ['A1', 'A2', 'A3'])
      await features.attachToSeat(await storeSeat(seatNumber), stored.id)

    await service.findByRoom(roomId)

    assert.equal(featureQueries, 1)
  })

  it('findByRoom leaves out soft-deleted seats', async () => {
    const [seatA, seatB] = [await storeSeat('A1'), await storeSeat('A2')]
    const stored = await store(dock)
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
    const stored = await store(dock)
    await features.attachToSeat(seatId, stored.id)

    assert.deepEqual(await service.findFeatures(seatId), [stored])
  })
})
