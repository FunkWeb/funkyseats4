import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { styleText } from 'util'
import mysql, { Connection, ConnectionOptions } from 'mysql2/promise'

interface Migration {
  up(conn: Connection): Promise<void>
}

interface TestDbConfig {
  database: string
  server: ConnectionOptions
}

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../migrations')
const TEST_DB_SUFFIX = '_test'
const LABEL_WIDTH = 51

const PASS = styleText('green', '✓')
const FAIL = styleText('red', '✗')

const label = (filename: string) => `${filename} `.padEnd(LABEL_WIDTH, '.')

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null

const hasUp = (value: unknown): value is Migration =>
  isObject(value) && 'up' in value && typeof value.up === 'function'

const defaultExport = (loaded: unknown): unknown =>
  isObject(loaded) && 'default' in loaded ? loaded.default : undefined

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env var ${name}`)
  }
  return value
}

function readConfig(): TestDbConfig {
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

function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((filename) => filename.endsWith('.ts') && !filename.endsWith('.d.ts'))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
}

async function loadMigration(filename: string): Promise<Migration> {
  const loaded: unknown = await import(pathToFileURL(join(MIGRATIONS_DIR, filename)).href)
  const migration = [loaded, defaultExport(loaded)].find(hasUp)
  if (!migration) {
    throw new Error(`${filename} does not export an up function`)
  }
  return migration
}

async function countPassing(conn: Connection, files: string[]): Promise<number> {
  for (const [index, filename] of files.entries()) {
    try {
      const migration = await loadMigration(filename)
      await migration.up(conn)
      console.log(`${label(filename)} ${PASS}`)
    } catch (error) {
      console.log(`${label(filename)} ${FAIL}  ERROR: ${errorMessage(error)}`)
      return index
    }
  }
  return files.length
}

async function withTestDatabase<T>(
  { database, server }: TestDbConfig,
  run: (conn: Connection) => Promise<T>,
): Promise<T> {
  const admin = await mysql.createConnection(server)
  const dropTestDb = `DROP DATABASE IF EXISTS ${mysql.escapeId(database)}`
  try {
    await admin.query(dropTestDb)
    await admin.query(`CREATE DATABASE ${mysql.escapeId(database)}`)
    const conn = await mysql.createConnection({ ...server, database })
    try {
      return await run(conn)
    } finally {
      await conn.end()
    }
  } finally {
    await admin.query(dropTestDb)
    await admin.end()
  }
}

async function main(): Promise<void> {
  const config = readConfig()
  const files = getMigrationFiles()
  const passed = await withTestDatabase(config, (conn) => countPassing(conn, files))
  const failed = passed < files.length ? 1 : 0
  const skipped = files.length - passed - failed

  console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`)
  process.exitCode = failed
}

main().catch((error) => {
  console.error(`${FAIL} Migration check aborted: ${errorMessage(error)}`)
  process.exitCode = 1
})