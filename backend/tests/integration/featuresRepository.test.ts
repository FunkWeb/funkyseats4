import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createFeaturesRepository,
  type FeaturesRepository,
} from '../../src/repositories/featuresRepository.js'
import { createSeatsRepository } from '../../src/repositories/seatsRepository.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, dock, linux, type Fixtures } from '../testFixtures.js'

const UNKNOWN_ID = 0

describe('featuresRepository', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let features: FeaturesRepository
  let roomId: number

  const storeSeat = (seatNumber: string) => fixtures.storeSeat(roomId, seatNumber)

  before(() => {
    fixtures = createFixtures(db())
    features = createFeaturesRepository(db())
  })

  beforeEach(async () => {
    await fixtures.reset()
    roomId = await fixtures.storeRoom('room-a')
  })

  it('goes through the create > attach > find > detach lifecycle', async () => {
    const seatId = await storeSeat('A1')
    const stored = await fixtures.storeFeature(dock)

    await features.attachToSeat(seatId, stored.id)
    assert.deepEqual(await features.findBySeatId(seatId), [stored])

    assert.equal(await features.detachFromSeat(seatId, stored.id), true)
    assert.deepEqual(await features.findBySeatId(seatId), [])
  })

  it('create stores every field', async () => {
    const stored = await fixtures.storeFeature(dock)
    assert.deepEqual(await features.findById(stored.id), stored)
  })

  it('create rejects a duplicate name', async () => {
    await fixtures.storeFeature(dock)
    await assert.rejects(features.create({ ...linux, name: dock.name }), {
      code: 'ER_DUP_ENTRY',
    })
  })

  it('update changes only the supplied fields', async () => {
    const stored = await fixtures.storeFeature(dock)
    assert.equal(
      await features.update(stored.id, { description: 'Updated description', iconPath: null }),
      true,
    )
    assert.deepEqual(await features.findById(stored.id), {
      ...stored,
      description: 'Updated description',
      iconPath: null,
    })
  })

  it('update returns false when the feature does not exist', async () => {
    assert.equal(await features.update(UNKNOWN_ID, { name: 'Updated' }), false)
  })

  it('delete removes the feature and its seat associations', async () => {
    const seatId = await storeSeat('A1')
    const stored = await fixtures.storeFeature(dock)
    await features.attachToSeat(seatId, stored.id)

    assert.equal(await features.delete(stored.id), true)
    assert.equal(await features.findById(stored.id), null)
    assert.deepEqual(await features.findBySeatId(seatId), [])
  })

  it('delete returns false when the feature does not exist', async () => {
    assert.equal(await features.delete(UNKNOWN_ID), false)
  })

  it('findById returns null when nothing matches', async () => {
    await fixtures.storeFeature(dock)
    assert.equal(await features.findById(UNKNOWN_ID), null)
  })

  it('findAll returns every feature ordered by name', async () => {
    await fixtures.storeFeature(linux)
    await fixtures.storeFeature(dock)
    assert.deepEqual(
      (await features.findAll()).map(({ name }) => name),
      [dock.name, linux.name],
    )
  })

  it('findBySeatId returns only that seat’s features, ordered by name', async () => {
    const [seatA, seatB] = [await storeSeat('A1'), await storeSeat('A2')]
    const [storedDock, storedLinux] = [
      await fixtures.storeFeature(dock),
      await fixtures.storeFeature(linux),
    ]
    await features.attachToSeat(seatA, storedLinux.id)
    await features.attachToSeat(seatA, storedDock.id)
    await features.attachToSeat(seatB, storedLinux.id)

    assert.deepEqual(await features.findBySeatId(seatA), [storedDock, storedLinux])
    assert.deepEqual(await features.findBySeatId(seatB), [storedLinux])
  })

  it('findByRoomId returns every feature in the room with its seatId, ordered by name', async () => {
    const [seatA, seatB] = [await storeSeat('A1'), await storeSeat('A2')]
    const [storedDock, storedLinux] = [
      await fixtures.storeFeature(dock),
      await fixtures.storeFeature(linux),
    ]
    await features.attachToSeat(seatA, storedLinux.id)
    await features.attachToSeat(seatB, storedDock.id)
    await features.attachToSeat(seatA, storedDock.id)

    const found = await features.findByRoomId(roomId)

    assert.deepEqual(
      found.map(({ name }) => name),
      [dock.name, dock.name, linux.name],
    )
    assert.deepEqual(
      found.filter(({ seatId }) => seatId === seatA),
      [
        { ...storedDock, seatId: seatA },
        { ...storedLinux, seatId: seatA },
      ],
    )
    assert.deepEqual(
      found.filter(({ seatId }) => seatId === seatB),
      [{ ...storedDock, seatId: seatB }],
    )
  })

  it('findByRoomId ignores seats in another room', async () => {
    const seatA = await storeSeat('A1')
    const otherSeat = await fixtures.storeSeat(await fixtures.storeRoom('room-b'), 'B1')
    const [storedDock, storedLinux] = [
      await fixtures.storeFeature(dock),
      await fixtures.storeFeature(linux),
    ]
    await features.attachToSeat(seatA, storedDock.id)
    await features.attachToSeat(otherSeat, storedLinux.id)

    assert.deepEqual(await features.findByRoomId(roomId), [{ ...storedDock, seatId: seatA }])
  })

  it('findByRoomId ignores soft-deleted seats', async () => {
    const [seatA, seatB] = [await storeSeat('A1'), await storeSeat('A2')]
    const stored = await fixtures.storeFeature(dock)
    await features.attachToSeat(seatA, stored.id)
    await features.attachToSeat(seatB, stored.id)
    await createSeatsRepository(db()).delete(seatB)

    assert.deepEqual(await features.findByRoomId(roomId), [{ ...stored, seatId: seatA }])
  })

  it('findByRoomId returns nothing when no seat has features', async () => {
    await storeSeat('A1')
    await fixtures.storeFeature(dock)
    assert.deepEqual(await features.findByRoomId(roomId), [])
  })

  it('attachToSeat rejects attaching the same feature twice', async () => {
    const seatId = await storeSeat('A1')
    const stored = await fixtures.storeFeature(dock)
    await features.attachToSeat(seatId, stored.id)
    await assert.rejects(features.attachToSeat(seatId, stored.id), { code: 'ER_DUP_ENTRY' })
  })

  for (const [target, link] of Object.entries({
    seat: (featureId: number) => features.attachToSeat(UNKNOWN_ID, featureId),
    feature: async () => features.attachToSeat(await storeSeat('A1'), UNKNOWN_ID),
  })) {
    it(`attachToSeat rejects an unknown ${target}`, async () => {
      const stored = await fixtures.storeFeature(dock)
      await assert.rejects(link(stored.id), { code: 'ER_NO_REFERENCED_ROW_2' })
    })
  }

  it('detachFromSeat returns false when the feature is not attached', async () => {
    const seatId = await storeSeat('A1')
    const stored = await fixtures.storeFeature(dock)
    assert.equal(await features.detachFromSeat(seatId, stored.id), false)
  })
})
