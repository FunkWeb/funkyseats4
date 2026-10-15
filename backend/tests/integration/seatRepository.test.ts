import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mysql, { type ConnectionOptions, type Pool } from 'mysql2/promise'
import { createPool } from '../../src/database/createPool.js'
import { readEnv } from '../../src/config/createConfig.js'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
} from '../../src/database/migration-runner/index.js'
import { seatsRepository } from '../../src/repositories/seatsRepository.js'
import type { CreateSeatInput } from '../../contracts/seat.js'

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
      host: env.required('DB_HOST'),
      port: parseInt(env.required('DB_PORT')),
      user: env.required('DB_USER'),
      password: env.required('DB_PASSWORD'),
    },
  }
}

describe('seatsRepository', () => {
  let admin: mysql.Connection | undefined
  let pool: Pool | undefined

  const testSeatInput: CreateSeatInput = {
    room_id: 1,
    seat_number: '10',
    description: 'Test seat',
  }

  before(async () => {
    const { database, server } = readConfig()
    const escapedDb = mysql.escapeId(database)

    admin = await mysql.createConnection(server)
    await admin.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin.query(`CREATE DATABASE ${escapedDb}`)
    const conn = await mysql.createConnection({ ...server, database })
    await ensureMigrationsTable(conn)
    for (const fileName of await listMigrationFiles()) {
      await apply(conn, fileName)
    }
    await conn.end()
    pool = createPool({ ...server, database })
  })

  after(async () => {
    const { database } = readConfig()
    const escapedDb = mysql.escapeId(database)
    await pool?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin?.end()
  })

  beforeEach(async () => {
    await pool?.query('DELETE FROM seats')
  })

  it('finds a seat by room ID', async () => {
    const created = await seatsRepository.create(testSeatInput)
    const seats = await seatsRepository.findByRoomId(testSeatInput.room_id)
    assert.strictEqual(seats.length, 1)
    assert.deepStrictEqual(seats[0], created)
  })

  it('updates a seat', async () => {
    const created = await seatsRepository.create(testSeatInput)
    const updatedSeat = await seatsRepository.update(created.id, {
      seat_number: '99',
    })
    assert.strictEqual(updatedSeat?.seat_number, '99')
  })

  it('soft deletes a seat', async () => {
    const created = await seatsRepository.create(testSeatInput)
    const success = await seatsRepository.softDelete(created.id)
    assert.equal(success, true)

    const found = await seatsRepository.findById(created.id)
    assert.equal(found, null)
  })
})
