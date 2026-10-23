import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NotFoundError } from '../../src/errors/appErrors.js'
import { createUsersRepository } from '../../src/repositories/usersRepository.js'
import { createUsersService, type UsersService } from '../../src/services/usersService.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const UNKNOWN_ID = 0

describe('usersService', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let service: UsersService
  let alice: number

  before(() => {
    fixtures = createFixtures(db())
    service = createUsersService({ users: createUsersRepository(db()) })
  })

  beforeEach(async () => {
    await fixtures.reset()
    alice = await fixtures.storeUser('alice')
  })

  it('findById returns the user as a DTO without googleId and with ISO dates', async () => {
    const user = await service.findById(alice)

    assert.partialDeepStrictEqual(user, {
      id: alice,
      name: 'alice',
      email: 'alice@example.com',
      avatarPath: null,
      role: 'CANDIDATE',
      lastLoginAt: null,
    })
    assert.equal('googleId' in user, false)
    assert.equal(new Date(user.createdAt).toISOString(), user.createdAt)
  })

  it('findById rejects an unknown user', async () => {
    await assert.rejects(service.findById(UNKNOWN_ID), NotFoundError)
  })

  it('findAll returns every user as a DTO ordered by name', async () => {
    await fixtures.storeUser('carol')
    await fixtures.storeUser('bob')

    const users = await service.findAll()

    assert.deepEqual(
      users.map(({ name }) => name),
      ['alice', 'bob', 'carol'],
    )
    assert.ok(users.every((user) => !('googleId' in user)))
  })

  it('updateRole changes the role', async () => {
    await service.updateRole(alice, { role: 'ADMIN' })
    assert.equal((await service.findById(alice)).role, 'ADMIN')
  })

  it('updateRole accepts the role the user already has', async () => {
    await service.updateRole(alice, { role: 'CANDIDATE' })
    assert.equal((await service.findById(alice)).role, 'CANDIDATE')
  })

  it('updateRole rejects an unknown user', async () => {
    await assert.rejects(service.updateRole(UNKNOWN_ID, { role: 'ADMIN' }), NotFoundError)
  })
})
