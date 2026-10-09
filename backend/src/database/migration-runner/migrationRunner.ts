import type { Connection, RowDataPacket } from 'mysql2/promise'
import { byFileName, listMigrationFiles, loadMigration, type Migration } from './migrationFiles.js'

const LOCK_NAME = 'schema_migrations'
const LOCK_TIMEOUT_SECONDS = 10

interface LockRow extends RowDataPacket {
  acquired: number | null
}

interface FileNameRow extends RowDataPacket {
  file_name: string
}

interface AppliedRow extends FileNameRow {
  applied_at: Date
}

export type MigrationState = 'applied' | 'pending' | 'missing'

export interface MigrationStatus {
  fileName: string
  state: MigrationState
  appliedAt?: Date
}

export const withMigrationLock = async (db: Connection, run: () => Promise<void>) => {
  const [[{ acquired }]] = await db.query<LockRow[]>('SELECT GET_LOCK(?, ?) AS acquired', [
    LOCK_NAME,
    LOCK_TIMEOUT_SECONDS,
  ])
  if (acquired !== 1) throw new Error('Another migration run holds the lock')
  try {
    await run()
  } finally {
    await db.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME])
  }
}

export const ensureMigrationsTable = (db: Connection) =>
  db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      file_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)

const findApplied = async (db: Connection) => {
  const [rows] = await db.query<AppliedRow[]>('SELECT file_name, applied_at FROM schema_migrations')
  return new Map(rows.map((row) => [row.file_name, row.applied_at]))
}

const stateOf = (isApplied: boolean, hasFile: boolean): MigrationState => {
  if (!isApplied) return 'pending'
  return hasFile ? 'applied' : 'missing'
}

export const findStatus = async (db: Connection): Promise<MigrationStatus[]> => {
  const applied = await findApplied(db)
  const files = new Set(await listMigrationFiles())
  return [...new Set([...files, ...applied.keys()])].sort(byFileName).map((fileName) => ({
    fileName,
    state: stateOf(applied.has(fileName), files.has(fileName)),
    appliedAt: applied.get(fileName),
  }))
}

export const fileNamesIn = (statuses: MigrationStatus[], state: MigrationState) =>
  statuses.filter((status) => status.state === state).map(({ fileName }) => fileName)

export const findLastApplied = async (db: Connection) => {
  const [rows] = await db.query<FileNameRow[]>(
    'SELECT file_name FROM schema_migrations ORDER BY applied_at DESC, file_name DESC LIMIT 1',
  )
  return rows[0]?.file_name
}

const rollBackAndThrow = async (
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
  throw new Error(`${fileName} failed and was rolled back`, { cause: upError })
}

export const apply = async (db: Connection, fileName: string) => {
  const migration = await loadMigration(fileName)
  try {
    await migration.up(db)
  } catch (upError) {
    await rollBackAndThrow(db, migration, fileName, upError)
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
