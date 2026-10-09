import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Connection } from 'mysql2/promise'

export interface Migration {
  up: (db: Connection) => Promise<void>
  down: (db: Connection) => Promise<void>
}

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, '..', 'migrations')

const isFunction = (value: unknown) => typeof value === 'function'

const isMigration = (value: unknown): value is Migration =>
  typeof value === 'object' &&
  value !== null &&
  'up' in value &&
  isFunction(value.up) &&
  'down' in value &&
  isFunction(value.down)

const isMigrationFile = (fileName: string) =>
  fileName.endsWith('.ts') && !fileName.endsWith('.d.ts')

export const byFileName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })

export const listMigrationFiles = async () =>
  (await readdir(MIGRATIONS_DIRECTORY)).filter(isMigrationFile).sort(byFileName)

export const loadMigration = async (fileName: string) => {
  const { default: migration } = await import(
    pathToFileURL(join(MIGRATIONS_DIRECTORY, fileName)).href
  )
  if (!isMigration(migration)) throw new Error(`${fileName} must default-export { up, down }`)
  return migration
}
