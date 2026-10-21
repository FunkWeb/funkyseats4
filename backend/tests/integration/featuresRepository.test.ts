import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { CreateFeatureRequest, FeatureDto } from '../../../contracts/feature.js'
import {
  createFeaturesRepository,
  type FeaturesRepository,
} from '../../src/repositories/featuresRepository.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const dock: CreateFeatureRequest = {
  name: 'Docking station',
  description: 'USB-C dock with two monitors',
  iconPath: '/icons/dock.svg',
  category: 'HARDWARE',
}

const linux: CreateFeatureRequest = {
  name: 'Linux',
  description: null,
  iconPath: null,
  category: 'OS',
}

const UNKNOWN_ID = 0

describe('featuresRepository', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let features: FeaturesRepository
  let roomId: number

  const store = async (feature: CreateFeatureRequest): Promise<FeatureDto> => ({
    ...feature,
    id: await features.create(feature),
  })

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
    const stored = await store(dock)

    await features.attachToSeat(seatId, stored.id)
    assert.deepEqual(await features.findBySeatId(seatId), [stored])

    assert.equal(await features.detachFromSeat(seatId, stored.id), true)
    assert.deepEqual(await features.findBySeatId(seatId), [])
  })

  it('create stores every field', async () => {
    const stored = await store(dock)
    assert.deepEqual(await features.findById(stored.id), stored)
  })

  it('create rejects a duplicate name', async () => {
    await store(dock)
    await assert.rejects(features.create({ ...linux, name: dock.name }), {
      code: 'ER_DUP_ENTRY',
    })
  })

  it('findById returns null when nothing matches', async () => {
    await store(dock)
    assert.equal(await features.findById(UNKNOWN_ID), null)
  })

  it('findAll returns every feature ordered by name', async () => {
    await store(linux)
    await store(dock)
    assert.deepEqual(
      (await features.findAll()).map(({ name }) => name),
      [dock.name, linux.name],
    )
  })

  it('findBySeatId returns only that seat’s features, ordered by name', async () => {
    const [seatA, seatB] = [await storeSeat('A1'), await storeSeat('A2')]
    const [storedDock, storedLinux] = [await store(dock), await store(linux)]
    await features.attachToSeat(seatA, storedLinux.id)
    await features.attachToSeat(seatA, storedDock.id)
    await features.attachToSeat(seatB, storedLinux.id)

    assert.deepEqual(await features.findBySeatId(seatA), [storedDock, storedLinux])
    assert.deepEqual(await features.findBySeatId(seatB), [storedLinux])
  })

  it('attachToSeat rejects attaching the same feature twice', async () => {
    const seatId = await storeSeat('A1')
    const stored = await store(dock)
    await features.attachToSeat(seatId, stored.id)
    await assert.rejects(features.attachToSeat(seatId, stored.id), { code: 'ER_DUP_ENTRY' })
  })

  for (const [target, link] of Object.entries({
    seat: (featureId: number) => features.attachToSeat(UNKNOWN_ID, featureId),
    feature: async () => features.attachToSeat(await storeSeat('A1'), UNKNOWN_ID),
  })) {
    it(`attachToSeat rejects an unknown ${target}`, async () => {
      const stored = await store(dock)
      await assert.rejects(link(stored.id), { code: 'ER_NO_REFERENCED_ROW_2' })
    })
  }

  it('detachFromSeat returns false when the feature is not attached', async () => {
    const seatId = await storeSeat('A1')
    const stored = await store(dock)
    assert.equal(await features.detachFromSeat(seatId, stored.id), false)
  })
})
