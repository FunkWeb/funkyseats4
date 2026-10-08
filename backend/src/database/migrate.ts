import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createConnection, type Connection, type RowDataPacket } from 'mysql2/promise'
import type { Migration } from './migration.js'

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "migrations");

const ensureMigrationsTable = (db: Connection) =>
  db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)

const findApplied = async (db: Connection) => {
  const [rows] = await db.query<RowDataPacket[]>('SELECT file_name FROM schema_migrations')
  return new Set(rows.map((row) => row.file_name as string))
}

const findPending = async (applied: Set<string>) => {
  const fileNames = await readdir(MIGRATIONS_DIRECTORY)
  return fileNames.filter((fileName) => fileName.endsWith('.ts') && !applied.has(fileName)).sort()
}

const loadMigration = async (fileName: string): Promise<Migration> => {
  const module = await import(pathToFileURL(join(MIGRATIONS_DIRECTORY, fileName)).href)
  return module.default
}

const undo = async (
  db: Connection,
  migration: Migration,
  fileName: string,
  upError: unknown,
): Promise<never> => {
  try {
    await migration.down(db)
  } catch (downError) {
    throw new AggregateError(
      [upError, downError],
      `${fileName} failed and down() also failed; fix the database by hand`,
      { cause: downError },
    )
  }
  throw new Error(`${fileName} failed and was undone`, { cause: upError })
}

const apply = async (db: Connection, fileName: string) => {
  const migration = await loadMigration(fileName)
  try {
    await migration.up(db)
  } catch (upError) {
    await undo(db, migration, fileName, upError)
  }
  await db.execute('INSERT INTO schema_migrations (file_name) VALUES (?)', [fileName])
}

const main = async () => {
  const db = await createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
  try {
    await ensureMigrationsTable(db)
    const pending = await findPending(await findApplied(db))
    for (const fileName of pending) {
      await apply(db, fileName)
      console.log(`✔ ${fileName}`)
    }
    if (pending.length === 0) console.log('Up to date')
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
