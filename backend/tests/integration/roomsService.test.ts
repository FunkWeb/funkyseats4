import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { CreateRoomRequest } from '../../../contracts/room.js'
import { ConflictError, NotFoundError, ValidationError } from '../../src/errors/appErrors.js'
import { createRoomsRepository } from '../../src/repositories/roomsRepository.js'
import { createRoomsService, type RoomsService } from '../../src/services/roomsService.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const UNKNOWN_ID = 0
const SLUG_MAX_LENGTH = 50

const validSlugs = ['kontor', 'kontor-a', 'rom-2', '3b', 'a'.repeat(SLUG_MAX_LENGTH)]

const invalidSlugs = [
  '',
  'kontor a',
  'Kontor-A',
  'kontor--a',
  '-kontor',
  'kontor-',
  'kontor_a',
  'kontør',
  '../kontor',
  'a'.repeat(SLUG_MAX_LENGTH + 1),
]

describe('roomsService', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let service: RoomsService
  let roomA: number

  const newRoom = (overrides: Partial<CreateRoomRequest> = {}): CreateRoomRequest => ({
    slug: 'room-b',
    name: 'Room B',
    ...overrides,
  })

  const activeSlugs = async () => (await service.findAll()).map(({ slug }) => slug)

  before(() => {
    fixtures = createFixtures(db())
    service = createRoomsService({ rooms: createRoomsRepository(db()) })
  })

  beforeEach(async () => {
    await fixtures.reset()
    roomA = await fixtures.storeRoom('room-a')
  })

  it('findById returns the room as a DTO without timestamps', async () => {
    const room = await service.findById(roomA)

    assert.deepEqual(room, {
      id: roomA,
      slug: 'room-a',
      name: 'room-a',
      description: null,
      seatMapPath: null,
      maxDaysAhead: 7,
    })
  })

  it('findById rejects an unknown room', async () => {
    await assert.rejects(service.findById(UNKNOWN_ID), NotFoundError)
  })

  it('findById rejects a deleted room', async () => {
    await service.delete(roomA)
    await assert.rejects(service.findById(roomA), NotFoundError)
  })

  it('findAll returns active rooms ordered by name', async () => {
    await fixtures.storeRoom('room-c')
    const deleted = await fixtures.storeRoom('room-b')
    await service.delete(deleted)

    assert.deepEqual(await activeSlugs(), ['room-a', 'room-c'])
  })

  it('create stores the room and returns its id', async () => {
    const id = await service.create(newRoom({ description: 'Quiet room', maxDaysAhead: 14 }))

    assert.partialDeepStrictEqual(await service.findById(id), {
      id,
      slug: 'room-b',
      name: 'Room B',
      description: 'Quiet room',
      maxDaysAhead: 14,
    })
  })

  for (const slug of validSlugs) {
    it(`create accepts the slug "${slug}"`, async () => {
      const id = await service.create(newRoom({ slug }))
      assert.equal((await service.findById(id)).slug, slug)
    })
  }

  for (const slug of invalidSlugs) {
    it(`create rejects the slug "${slug}"`, async () => {
      await assert.rejects(service.create(newRoom({ slug })), ValidationError)
      assert.deepEqual(await activeSlugs(), ['room-a'])
    })
  }

  it('create rejects a slug held by an active room', async () => {
    await assert.rejects(service.create(newRoom({ slug: 'room-a' })), ConflictError)
    assert.deepEqual(await activeSlugs(), ['room-a'])
  })

  it('create reuses the slug of a deleted room', async () => {
    await service.delete(roomA)

    const id = await service.create(newRoom({ slug: 'room-a' }))

    assert.notEqual(id, roomA)
    assert.deepEqual(await activeSlugs(), ['room-a'])
  })

  it('update changes the given fields and leaves the rest untouched', async () => {
    await service.update(roomA, { name: 'Renamed', maxDaysAhead: 14 })

    assert.partialDeepStrictEqual(await service.findById(roomA), {
      slug: 'room-a',
      name: 'Renamed',
      maxDaysAhead: 14,
    })
  })

  it('update changes the slug to a free one', async () => {
    await service.update(roomA, { slug: 'room-z' })
    assert.equal((await service.findById(roomA)).slug, 'room-z')
  })

  it('update accepts the slug the room already has', async () => {
    await service.update(roomA, { slug: 'room-a', name: 'Renamed' })
    assert.equal((await service.findById(roomA)).name, 'Renamed')
  })

  it('update rejects a slug held by another active room', async () => {
    await fixtures.storeRoom('room-b')

    await assert.rejects(service.update(roomA, { slug: 'room-b' }), ConflictError)
    assert.equal((await service.findById(roomA)).slug, 'room-a')
  })

  it('update reuses the slug of a deleted room', async () => {
    const deleted = await fixtures.storeRoom('room-b')
    await service.delete(deleted)

    await service.update(roomA, { slug: 'room-b' })

    assert.equal((await service.findById(roomA)).slug, 'room-b')
  })

  for (const slug of invalidSlugs) {
    it(`update rejects the slug "${slug}"`, async () => {
      await assert.rejects(service.update(roomA, { slug }), ValidationError)
      assert.equal((await service.findById(roomA)).slug, 'room-a')
    })
  }

  for (const [label, input] of [
    ['an empty input', {}],
    ['only undefined fields', { name: undefined }],
  ] as const) {
    it(`update accepts ${label} and leaves the room untouched`, async () => {
      const original = await service.findById(roomA)
      await service.update(roomA, input)
      assert.deepEqual(await service.findById(roomA), original)
    })
  }

  it('update rejects an unknown room', async () => {
    await assert.rejects(service.update(UNKNOWN_ID, { name: 'Missing' }), NotFoundError)
  })

  it('update rejects a deleted room', async () => {
    await service.delete(roomA)
    await assert.rejects(service.update(roomA, { name: 'Deleted' }), NotFoundError)
  })

  it('delete removes the room from findAll', async () => {
    await service.delete(roomA)
    assert.deepEqual(await activeSlugs(), [])
  })

  it('delete rejects a room that is already deleted', async () => {
    await service.delete(roomA)
    await assert.rejects(service.delete(roomA), NotFoundError)
  })

  it('delete rejects an unknown room', async () => {
    await assert.rejects(service.delete(UNKNOWN_ID), NotFoundError)
  })
})
