import { after, before, describe, it } from 'node:test'
import mysql, { type Connection, type ConnectionOptions } from 'mysql2/promise'
import { optionalPort, requireEnv } from '../../src/config/createConfig.js'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
  revert,
} from '../../src/database/migration-runner/index.js'

const TEST_DB_SUFFIX = '_test'

const readConfig = (): { database: string; server: ConnectionOptions } => {
  const database = requireEnv(process.env, 'DB_TEST_NAME')
  if (database === process.env.DB_NAME || !database.endsWith(TEST_DB_SUFFIX)) {
    throw new Error(
      `Refusing to drop "${database}": test database must end in ${TEST_DB_SUFFIX} and differ from DB_NAME`,
    )
  }
  return {
    database,
    server: {
      host: requireEnv(process.env, 'DB_TEST_HOST'),
      port: optionalPort(process.env, 'DB_TEST_PORT', 3306),
      user: requireEnv(process.env, 'DB_USER'),
      password: requireEnv(process.env, 'DB_PASSWORD'),
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
    it(`${fileName} applies, reverts and reapplies`, async (t) => {
      if (previousFailed) return t.skip('previous migration failed')
      try {
        await apply(conn!, fileName)
        await revert(conn!, fileName)
        await apply(conn!, fileName)
      } catch (error) {
        previousFailed = true
        throw error
      }
    })
  }
})
