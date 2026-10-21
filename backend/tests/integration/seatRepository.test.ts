import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createSeatsRepository,
  type SeatsRepository,
} from '../../src/repositories/seatsRepository.js'
import type { CreateSeatRequest, UpdateSeatRequest } from '../../../contracts/seat.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

type StoredSeat = CreateSeatRequest & { id: number }

describe('seatsRepository', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let seats: SeatsRepository
  let roomId: number
  let otherRoomId: number

  const newSeat = (overrides: Partial<CreateSeatRequest> = {}): CreateSeatRequest => ({
    roomId,
    seatNumber: 'A1',
    description: null,
    ...overrides,
  })

  const store = async (seat: CreateSeatRequest): Promise<StoredSeat> => ({
    ...seat,
    id: await seats.create(seat),
  })

  before(() => {
    fixtures = createFixtures(db())
    seats = createSeatsRepository(db())
  })

  beforeEach(async () => {
    await fixtures.reset()
    roomId = await fixtures.storeRoom('room-1')
    otherRoomId = await fixtures.storeRoom('room-2')
  })

  it('create stores the seat as active with timestamps', async () => {
    const stored = await store(newSeat({ description: 'By the window' }))
    const found = await seats.findById(stored.id)
    assert.partialDeepStrictEqual(found, { ...stored, deletedAt: null })
    assert.ok(found?.createdAt)
    assert.ok(found?.updatedAt)
  })

  it('create rejects an unknown room', async () => {
    await assert.rejects(seats.create(newSeat({ roomId: 0 })), {
      code: 'ER_NO_REFERENCED_ROW_2',
    })
  })

  it('findById returns the matching seat', async () => {
    const stored = await store(newSeat())
    await store(newSeat({ seatNumber: 'A2' }))
    assert.partialDeepStrictEqual(await seats.findById(stored.id), stored)
  })

  it('findById returns null when nothing matches', async () => {
    await store(newSeat())
    assert.equal(await seats.findById(0), null)
  })

  it('findByRoomId returns only that room’s seats ordered by seat number', async () => {
    await store(newSeat({ seatNumber: 'B1' }))
    await store(newSeat({ seatNumber: 'A1' }))
    await store(newSeat({ roomId: otherRoomId, seatNumber: 'C1' }))
    const found = await seats.findByRoomId(roomId)
    assert.deepEqual(
      found.map(({ seatNumber }) => seatNumber),
      ['A1', 'B1'],
    )
  })

  it('findByRoomId returns an empty list for a room without seats', async () => {
    await store(newSeat())
    assert.deepEqual(await seats.findByRoomId(otherRoomId), [])
  })

  it('findAll returns every seat ordered by room', async () => {
    await store(newSeat({ roomId: otherRoomId, seatNumber: 'B1' }))
    await store(newSeat({ roomId, seatNumber: 'A1' }))
    const all = await seats.findAll()
    assert.deepEqual(
      all.map((seat) => seat.roomId),
      [roomId, otherRoomId],
    )
  })

  const fieldUpdates: Array<[field: string, changes: () => UpdateSeatRequest]> = [
    ['seatNumber', () => ({ seatNumber: 'Z9' })],
    ['description', () => ({ description: 'Near the window' })],
    ['roomId', () => ({ roomId: otherRoomId })],
  ]

  for (const [field, changes] of fieldUpdates) {
    it(`update changes ${field} and leaves the rest untouched`, async () => {
      const stored = await store(newSeat({ description: 'Original' }))
      const input = changes()
      assert.equal(await seats.update(stored.id, input), true)
      assert.partialDeepStrictEqual(await seats.findById(stored.id), {
        ...stored,
        ...input,
      })
    })
  }

  it('update can clear the description', async () => {
    const stored = await store(newSeat({ description: 'Original' }))
    assert.equal(await seats.update(stored.id, { description: null }), true)
    assert.equal((await seats.findById(stored.id))?.description, null)
  })

  it('update can change several fields at once', async () => {
    const stored = await store(newSeat())
    assert.equal(await seats.update(stored.id, { seatNumber: 'B2', description: 'Corner' }), true)
    assert.partialDeepStrictEqual(await seats.findById(stored.id), {
      ...stored,
      seatNumber: 'B2',
      description: 'Corner',
    })
  })

  it('update returns false when there is nothing to update', async () => {
    const stored = await store(newSeat())
    assert.equal(await seats.update(stored.id, {}), false)
  })

  it('update returns false for an unknown id', async () => {
    assert.equal(await seats.update(0, { seatNumber: 'Z9' }), false)
  })

  it('delete removes the seat', async () => {
    const stored = await store(newSeat())
    assert.equal(await seats.delete(stored.id), true)
    assert.equal(await seats.findById(stored.id), null)
  })

  it('delete returns false for an unknown id', async () => {
    assert.equal(await seats.delete(0), false)
  })
})
