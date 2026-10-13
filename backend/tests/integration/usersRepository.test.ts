import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mysql, { type Connection, type ConnectionOptions, type Pool } from 'mysql2/promise'
import { readEnv } from '../../src/config/createConfig.js'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
} from '../../src/database/migration-runner/index.js'
import {
  createUsersRepository,
  type NewUser,
  type UsersRepository,
} from '../../src/repositories/usersRepository.js'

const TEST_DB_SUFFIX = '_test'

const readConfig = (): { database: string; server: ConnectionOptions } => {
  const env = readEnv(process.env)
  const database = env.required('DB_TEST_NAME')
  if (database === process.env.DB_NAME || !database.endsWith(TEST_DB_SUFFIX)) {
    throw new Error(
      `Refusing to drop "${database}": test database must end in ${TEST_DB_SUFFIX} and differ from DB_NAME`,
    )
  }
  return {
    database,
    server: {
      host: env.required('DB_TEST_HOST'),
      port: env.requiredPort('DB_TEST_PORT'),
      user: env.required('DB_USER'),
      password: env.required('DB_PASSWORD'),
    },
  }
}

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

const missing: StoredUser = { ...alice, id: 0, googleId: 'unknown', email: 'unknown@example.com' }

describe('usersRepository', () => {
  const { database, server } = readConfig()
  const escapedDb = mysql.escapeId(database)
  let admin: Connection | undefined
  let pool: Pool | undefined
  let users: UsersRepository

  const store = async (user: NewUser): Promise<StoredUser> => ({
    ...user,
    id: await users.create(user),
  })

  const lookups = {
    findById: (user: StoredUser) => users.findById(user.id),
    findByGoogleId: (user: StoredUser) => users.findByGoogleId(user.googleId),
    findByEmail: (user: StoredUser) => users.findByEmail(user.email),
  }

  before(async () => {
    admin = await mysql.createConnection(server)
    await admin.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin.query(`CREATE DATABASE ${escapedDb}`)
    const conn = await mysql.createConnection({ ...server, database })
    await ensureMigrationsTable(conn)
    for (const fileName of await listMigrationFiles()) await apply(conn, fileName)
    await conn.end()
    pool = mysql.createPool({ ...server, database, namedPlaceholders: true, timezone: 'Z' })
    users = createUsersRepository(pool)
  })

  after(async () => {
    await pool?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin?.end()
  })

  beforeEach(async () => {
    await pool!.query('DELETE FROM users')
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

  for (const [name, find] of Object.entries(lookups)) {
    it(`${name} returns the matching user`, async () => {
      const stored = await store(alice)
      await store(bob)
      assert.partialDeepStrictEqual(await find(stored), stored)
    })

    it(`${name} returns undefined when nothing matches`, async () => {
      await store(alice)
      assert.equal(await find(missing), undefined)
    })
  }

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

  it('recordLogin sets lastLoginAt', async () => {
    const stored = await store(alice)
    assert.equal(await users.recordLogin(stored.id), true)
    assert.ok((await users.findById(stored.id))?.lastLoginAt instanceof Date)
  })

  for (const [name, update] of Object.entries({
    updateRole: (id: number) => users.updateRole(id, 'ADMIN'),
    recordLogin: (id: number) => users.recordLogin(id),
  })) {
    it(`${name} returns false for an unknown id`, async () => {
      assert.equal(await update(missing.id), false)
    })
  }
})
