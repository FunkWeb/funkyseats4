import { after, before, describe, it } from 'node:test'
import mysql, { type Connection, type ConnectionOptions } from 'mysql2/promise'
import { readEnv } from '../../src/config/createConfig.js'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
  revert,
} from '../../src/database/migration-runner/index.js'

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

const migrationFiles = await listMigrationFiles()

describe('migrations', () => {
  const { database, server } = readConfig()
  const escapedDb = mysql.escapeId(database)
  let admin: Connection | undefined
  let conn: Connection | undefined
  let previousFailed = false

  before(async () => {
    admin = await mysql.createConnection(server)
    await admin.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin.query(`CREATE DATABASE ${escapedDb}`)
    conn = await mysql.createConnection({ ...server, database })
    await ensureMigrationsTable(conn)
  })

  after(async () => {
    await conn?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin?.end()
  })

  for (const fileName of migrationFiles) {
    it(`${fileName} applies, reverts idempotently and reapplies`, async (t) => {
      if (previousFailed) return t.skip('previous migration failed')
      try {
        await apply(conn!, fileName)
        await revert(conn!, fileName)
        await revert(conn!, fileName)
        await apply(conn!, fileName)
      } catch (error) {
        previousFailed = true
        throw error
      }
    })
  }
})
