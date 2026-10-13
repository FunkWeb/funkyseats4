import { after, before } from 'node:test'
import mysql, { type Connection, type ConnectionOptions, type Pool } from 'mysql2/promise'
import { readEnv } from '../../src/config/createConfig.js'
import { createPool } from '../../src/database/createPool.js'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
} from '../../src/database/migration-runner/index.js'

const TEST_DB_SUFFIX = '_test'

export const readTestDbConfig = (): { database: string; server: ConnectionOptions } => {
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

export const useMigratedTestDatabase = (): (() => Pool) => {
  const { database, server } = readTestDbConfig()
  const escapedDb = mysql.escapeId(database)
  let admin: Connection | undefined
  let pool: Pool | undefined

  before(async () => {
    admin = await mysql.createConnection(server)
    await admin.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin.query(`CREATE DATABASE ${escapedDb}`)
    const conn = await mysql.createConnection({ ...server, database })
    await ensureMigrationsTable(conn)
    for (const fileName of await listMigrationFiles()) await apply(conn, fileName)
    await conn.end()
    pool = createPool({ ...server, database })
  })

  after(async () => {
    await pool?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin?.end()
  })

  return () => pool!
}
