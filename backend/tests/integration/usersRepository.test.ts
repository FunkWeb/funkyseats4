import { before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  createUsersRepository,
  type NewUser,
  type UsersRepository,
} from '../../src/repositories/usersRepository.js'
import { useMigratedTestDatabase } from '../testDatabase.js'

type StoredUser = NewUser & { id: number }

const alice: NewUser = {
  googleId: 'google-alice',
  name: 'Alice',
  email: 'alice@example.com',
  avatarPath: null,
  role: 'CANDIDATE',
}

const bob: NewUser = {
  googleId: 'google-bob',
  name: 'Bob',
  email: 'bob@example.com',
  avatarPath: '/avatars/bob.png',
  role: 'SUPERVISOR',
}

const UNKNOWN_ID = 0

describe('usersRepository', () => {
  const db = useMigratedTestDatabase()
  let users: UsersRepository

  const store = async (user: NewUser): Promise<StoredUser> => ({
    ...user,
    id: await users.create(user),
  })

  before(() => {
    users = createUsersRepository(db())
  })

  beforeEach(async () => {
    await db().query('DELETE FROM users')
  })

  it('create stores the user with no login recorded', async () => {
    const stored = await store(alice)
    const found = await users.findById(stored.id)
    assert.partialDeepStrictEqual(found, { ...stored, lastLoginAt: null })
    assert.ok(found?.createdAt instanceof Date)
  })

  for (const field of ['googleId', 'email'] as const) {
    it(`create rejects a duplicate ${field}`, async () => {
      await store(alice)
      await assert.rejects(users.create({ ...bob, [field]: alice[field] }), {
        code: 'ER_DUP_ENTRY',
      })
    })
  }

  it('findById returns the matching user', async () => {
    const stored = await store(alice)
    await store(bob)
    assert.partialDeepStrictEqual(await users.findById(stored.id), stored)
  })

  it('findById returns null when nothing matches', async () => {
    await store(alice)
    assert.equal(await users.findById(UNKNOWN_ID), null)
  })

  it('findAll returns every user ordered by name', async () => {
    await store(bob)
    await store(alice)
    const all = await users.findAll()
    assert.deepEqual(
      all.map(({ name }) => name),
      ['Alice', 'Bob'],
    )
  })

  it('updateRole changes the role', async () => {
    const stored = await store(alice)
    assert.equal(await users.updateRole(stored.id, 'ADMIN'), true)
    assert.equal((await users.findById(stored.id))?.role, 'ADMIN')
  })

  it('updateRole returns false for an unknown id', async () => {
    assert.equal(await users.updateRole(UNKNOWN_ID, 'ADMIN'), false)
  })

  it('upsertGoogleLogin creates a new user with login recorded', async () => {
    const user = await users.upsertGoogleLogin(alice)
    assert.partialDeepStrictEqual(user, alice)
    assert.ok(user.lastLoginAt instanceof Date)
  })

  it('upsertGoogleLogin returns the existing user and keeps their role', async () => {
    const stored = await store(bob)
    const user = await users.upsertGoogleLogin({ ...bob, role: 'CANDIDATE' })
    assert.partialDeepStrictEqual(user, stored)
    assert.ok(user.lastLoginAt instanceof Date)
  })

  it('upsertGoogleLogin rejects a new googleId with an existing email', async () => {
    await store(alice)
    await assert.rejects(users.upsertGoogleLogin({ ...bob, email: alice.email }), /collided/)
  })
})
