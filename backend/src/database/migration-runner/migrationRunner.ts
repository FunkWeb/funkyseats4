import type { Connection, RowDataPacket } from 'mysql2/promise'
import { listMigrationFiles, loadMigration, type Migration } from './migrationFiles.js'

export const ensureMigrationsTable = (db: Connection) =>
  db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)

export type MigrationState = 'applied' | 'pending' | 'missing'

export interface MigrationStatus {
  fileName: string
  state: MigrationState
  appliedAt?: Date
}

const findApplied = async (db: Connection) => {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT file_name, applied_at FROM schema_migrations',
  )
  return new Map(rows.map((row) => [row.file_name as string, row.applied_at as Date]))
}

const stateOf = (isApplied: boolean, hasFile: boolean): MigrationState => {
  if (!isApplied) return 'pending'
  return hasFile ? 'applied' : 'missing'
}

export const findStatus = async (db: Connection): Promise<MigrationStatus[]> => {
  const applied = await findApplied(db)
  const files = new Set(await listMigrationFiles())
  return [...new Set([...files, ...applied.keys()])].sort().map((fileName) => ({
    fileName,
    state: stateOf(applied.has(fileName), files.has(fileName)),
    appliedAt: applied.get(fileName),
  }))
}

export const findPending = async (db: Connection) =>
  (await findStatus(db)).filter(({ state }) => state === 'pending').map(({ fileName }) => fileName)

export const findLastApplied = async (db: Connection) => {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT file_name FROM schema_migrations ORDER BY file_name DESC LIMIT 1',
  )
  return rows[0]?.file_name as string | undefined
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

export const apply = async (db: Connection, fileName: string) => {
  const migration = await loadMigration(fileName)
  try {
    await migration.up(db)
  } catch (upError) {
    await undo(db, migration, fileName, upError)
  }
  await db.execute('INSERT INTO schema_migrations (file_name) VALUES (?)', [fileName])
}

export const revert = async (db: Connection, fileName: string) => {
  const migration = await loadMigration(fileName)
  try {
    await migration.down(db)
  } catch (downError) {
    throw new Error(`${fileName} down() failed; it is still recorded as applied`, {
      cause: downError,
    })
  }
  await db.execute('DELETE FROM schema_migrations WHERE file_name = ?', [fileName])
}
