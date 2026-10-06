import { after, before, describe, it } from 'node:test'
import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import mysql, { Connection, ConnectionOptions } from 'mysql2/promise'

interface Migration {
  up(conn: Connection): Promise<void>
}

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../src/database/migrations')
const TEST_DB_SUFFIX = '_test'

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null

const isMigration = (value: unknown): value is Migration =>
  isObject(value) && 'up' in value && typeof value.up === 'function'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name}`)
  return value
}

function readConfig(): { database: string; server: ConnectionOptions } {
  const database = requireEnv('DB_TEST_NAME')
  if (database === process.env.DB_NAME || !database.endsWith(TEST_DB_SUFFIX)) {
    throw new Error(
      `Refusing to drop "${database}": test database must end in ${TEST_DB_SUFFIX} and differ from DB_NAME`,
    )
  }
  return {
    database,
    server: {
      host: requireEnv('DB_TEST_HOST'),
      port: Number(requireEnv('DB_TEST_PORT')),
      user: requireEnv('DB_USER'),
      password: requireEnv('DB_PASSWORD'),
    },
  }
}

const getMigrationFiles = () =>
  readdirSync(MIGRATIONS_DIR)
    .filter((filename) => filename.endsWith('.ts') && !filename.endsWith('.d.ts'))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))

async function loadMigration(filename: string): Promise<Migration> {
  const loaded: unknown = await import(pathToFileURL(join(MIGRATIONS_DIR, filename)).href)
  const fallback = isObject(loaded) && 'default' in loaded ? loaded.default : undefined
  const migration = [loaded, fallback].find(isMigration)
  if (!migration) throw new Error(`${filename} must export an up function`)
  return migration
}

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
  })

  after(async () => {
    await conn?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin?.end()
  })

  for (const filename of getMigrationFiles()) {
    it(filename, async (t) => {
      if (previousFailed) return t.skip('previous migration failed')
      try {
        const migration = await loadMigration(filename)
        await migration.up(conn!)
      } catch (error) {
        previousFailed = true
        throw error
      }
    })
  }
})
