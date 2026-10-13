import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, before, describe, it } from 'node:test'
import mysql, {
  type Connection,
  type ConnectionOptions,
  type Pool,
  type ResultSetHeader,
} from 'mysql2/promise'
import type { CreateBookingRequest } from '../../../contracts/booking.js'
import { readEnv } from '../../src/config/createConfig.js'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
} from '../../src/database/migration-runner/index.js'
import { createBookingsRepository } from '../../src/repositories/bookingsRepository.js'

const TEST_DB_SUFFIX = '_test'

const readTestConfig = (): { database: string; server: ConnectionOptions } => {
  const env = readEnv(process.env)
  const database = env.required('DB_TEST_NAME')
  if (database === env.required('DB_NAME') || !database.endsWith(TEST_DB_SUFFIX)) {
    throw new Error(
      `Refusing to modify "${database}": test database must end in ${TEST_DB_SUFFIX} and differ from DB_NAME`,
    )
  }

  return {
    database,
    server: {
      host: env.required('DB_TEST_HOST'),
      port: env.requiredPort('DB_TEST_PORT'),
      user: env.required('DB_USER'),
      password: env.required('DB_PASSWORD'),
      timezone: 'Z',
    },
  }
}

describe('bookingsRepository integration', () => {
  const { database, server } = readTestConfig()
  const escapedDatabase = mysql.escapeId(database)
  let admin: Connection | undefined
  let migrationConnection: Connection | undefined
  let testPool: Pool | undefined

  before(async () => {
    admin = await mysql.createConnection(server)
    await admin.query(`DROP DATABASE IF EXISTS ${escapedDatabase}`)
    await admin.query(`CREATE DATABASE ${escapedDatabase}`)

    migrationConnection = await mysql.createConnection({ ...server, database })
    await ensureMigrationsTable(migrationConnection)
    for (const fileName of await listMigrationFiles()) {
      await apply(migrationConnection, fileName)
    }

    testPool = mysql.createPool({
      ...server,
      database,
      waitForConnections: true,
      timezone: 'Z',
    })
  })

  after(async () => {
    await testPool?.end()
    await migrationConnection?.end()
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS ${escapedDatabase}`)
      await admin.end()
    }
  })

  it('creates a booking, finds it, and updates its status to CANCELLED', async () => {
    assert.ok(testPool)
    const repository = createBookingsRepository(testPool)
    const fixtureId = randomUUID()
    const [userResult] = await testPool.execute<ResultSetHeader>(
      `INSERT INTO users (google_id, name, email, role) VALUES (?, ?, ?, 'CANDIDATE')`,
      [fixtureId, 'Booking Test User', `${fixtureId}@example.test`],
    )
    const [roomResult] = await testPool.execute<ResultSetHeader>(
      'INSERT INTO rooms (slug, name) VALUES (?, ?)',
      [`booking-${fixtureId}`, 'Booking Test Room'],
    )
    const [seatResult] = await testPool.execute<ResultSetHeader>(
      'INSERT INTO seats (room_id, seat_number) VALUES (?, ?)',
      [roomResult.insertId, 'A1'],
    )
    const booking: CreateBookingRequest = {
      seatId: seatResult.insertId,
      userId: userResult.insertId,
      bookingDate: '2030-01-02',
      timePeriod: 'BEFORE_LUNCH',
    }

    const created = await repository.create(booking)
    assert.equal(created.status, 'ACTIVE')
    assert.equal(created.seatId, booking.seatId)
    assert.equal(created.userId, booking.userId)
    assert.equal(created.bookingDate, booking.bookingDate)
    assert.equal(created.timePeriod, booking.timePeriod)

    assert.deepEqual(await repository.findById(created.id), created)
    assert.deepEqual(await repository.findByUserId(booking.userId), [created])
    assert.deepEqual(await repository.findBySeatAndDate(booking.seatId, booking.bookingDate), [
      created,
    ])
    assert.equal(await repository.findById(0), null)

    const cancelled = await repository.updateStatus(created.id, 'CANCELLED')
    assert.ok(cancelled)
    assert.equal(cancelled.id, created.id)
    assert.equal(cancelled.status, 'CANCELLED')
    assert.equal(await repository.updateStatus(0, 'CANCELLED'), null)
    assert.equal((await repository.findById(created.id))?.status, 'CANCELLED')
  })
})
