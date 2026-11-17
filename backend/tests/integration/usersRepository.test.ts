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

const carol: NewUser = {
  googleId: 'google-carol',
  name: 'Carol',
  email: 'carol@example.com',
  avatarPath: null,
  role: 'ADMIN',
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
    const { items: all } = await users.findAll({ page: 1, pageSize: 20 })
    assert.deepEqual(
      all.map(({ name }) => name),
      ['Alice', 'Bob'],
    )
  })

  it('findAll splits users into pages and counts every user in total', async () => {
    await store(bob)
    await store(alice)
    await store(carol)

    const namesOnPage = async (page: number) => {
      const { items, total } = await users.findAll({ page, pageSize: 2 })
      return { names: items.map(({ name }) => name), total }
    }

    assert.deepEqual(await namesOnPage(1), { names: ['Alice', 'Bob'], total: 3 })
    assert.deepEqual(await namesOnPage(2), { names: ['Carol'], total: 3 })
  })

  it('findAll returns no items for a page past the last one', async () => {
    await store(alice)
    assert.deepEqual(await users.findAll({ page: 2, pageSize: 20 }), { items: [], total: 1 })
  })

  it('findAll orders users with the same name by id so no user appears on two pages', async () => {
    const first = await store(alice)
    const second = await store({ ...bob, name: alice.name })

    const { items: page1 } = await users.findAll({ page: 1, pageSize: 1 })
    const { items: page2 } = await users.findAll({ page: 2, pageSize: 1 })

    assert.deepEqual(
      [...page1, ...page2].map(({ id }) => id),
      [first.id, second.id],
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

  it('create starts the user at session version 0', async () => {
    const stored = await store(alice)
    assert.equal((await users.findById(stored.id))?.sessionVersion, 0)
  })

  it('revokeSessions advances the session version when given the current one', async () => {
    const stored = await store(alice)
    assert.equal(await users.revokeSessions(stored.id, 0), true)
    assert.equal((await users.findById(stored.id))?.sessionVersion, 1)
  })

  it('revokeSessions ignores a stale session version', async () => {
    const stored = await store(alice)
    await users.revokeSessions(stored.id, 0)
    assert.equal(await users.revokeSessions(stored.id, 0), false)
    assert.equal((await users.findById(stored.id))?.sessionVersion, 1)
  })

  it('revokeSessions only affects the given user', async () => {
    const storedAlice = await store(alice)
    const storedBob = await store(bob)
    await users.revokeSessions(storedAlice.id, 0)
    assert.equal((await users.findById(storedBob.id))?.sessionVersion, 0)
  })

  it('upsertGoogleLogin keeps the session version of an existing user', async () => {
    const stored = await store(bob)
    await users.revokeSessions(stored.id, 0)
    assert.equal((await users.upsertGoogleLogin(bob)).sessionVersion, 1)
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
