import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createRoomsRepository,
  type NewRoom,
  type RoomsRepository,
} from '../../src/repositories/roomsRepository.js'
import { useMigratedTestDatabase } from '../testDatabase.js'

const room: NewRoom = {
  slug: 'room-a',
  name: 'Room A',
}

describe('roomsRepository', () => {
  const db = useMigratedTestDatabase()
  let rooms: RoomsRepository

  const store = async (newRoom: NewRoom) => {
    const id = await rooms.create(newRoom)
    const stored = await rooms.findById(id)
    if (!stored) throw new Error('Created room was not found')
    return stored
  }

  before(() => {
    rooms = createRoomsRepository(db())
  })

  beforeEach(async () => {
    for (const table of ['bookings', 'seat_features', 'seats', 'rooms']) {
      await db().query(`DELETE FROM ${table}`)
    }
  })

  it('create uses database defaults for optional fields', async () => {
    const stored = await store(room)

    assert.partialDeepStrictEqual(stored, {
      ...room,
      description: null,
      seatMapPath: null,
      maxDaysAhead: 7,
      deletedAt: null,
    })
    assert.ok(stored.updatedAt instanceof Date)
    assert.ok(stored.createdAt instanceof Date)
  })

  it('create stores optional fields when provided', async () => {
    const stored = await store({
      ...room,
      description: 'Main room',
      seatMapPath: '/maps/room-a.svg',
      maxDaysAhead: 14,
    })

    assert.partialDeepStrictEqual(stored, {
      ...room,
      description: 'Main room',
      seatMapPath: '/maps/room-a.svg',
      maxDaysAhead: 14,
    })
  })

  it('findById returns null when no active room matches', async () => {
    assert.equal(await rooms.findById(0), null)
  })

  it('findAll returns active rooms ordered by name', async () => {
    await store({ slug: 'room-b', name: 'Room B' })
    await store({ slug: 'room-a', name: 'Room A' })
    const deleted = await store({ slug: 'room-c', name: 'Room C' })
    await rooms.delete(deleted.id)

    assert.deepEqual(
      (await rooms.findAll()).map(({ name }) => name),
      ['Room A', 'Room B'],
    )
  })

  it('update changes an active room', async () => {
    const stored = await store(room)

    assert.equal(
      await rooms.update(stored.id, 'name = :name, max_days_ahead = :maxDaysAhead', {
        name: 'Updated room',
        maxDaysAhead: 14,
      }),
      true,
    )
    assert.partialDeepStrictEqual(await rooms.findById(stored.id), {
      name: 'Updated room',
      maxDaysAhead: 14,
    })
    assert.equal(await rooms.update(0, 'name = :name', { name: 'Missing room' }), false)
  })

  it('delete soft-deletes an active room', async () => {
    const stored = await store(room)

    assert.equal(await rooms.delete(stored.id), true)
    assert.equal(await rooms.findById(stored.id), null)
    assert.equal(await rooms.delete(stored.id), false)
  })
})
