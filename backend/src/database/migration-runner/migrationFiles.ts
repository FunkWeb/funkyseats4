import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Connection } from 'mysql2/promise'

export interface Migration {
  up: (db: Connection) => Promise<void>
  down: (db: Connection) => Promise<void>
}

const MIGRATIONS_DIRECTORY = join(import.meta.dirname, '..', 'migrations')
const RUNTIME_EXTENSION = import.meta.url.endsWith('.ts') ? '.ts' : '.js'

const isFunction = (value: unknown) => typeof value === 'function'

const isMigration = (value: unknown): value is Migration =>
  typeof value === 'object' &&
  value !== null &&
  'up' in value &&
  isFunction(value.up) &&
  'down' in value &&
  isFunction(value.down)

const isMigrationFile = (fileName: string) =>
  fileName.endsWith(RUNTIME_EXTENSION) && !fileName.endsWith('.d.ts')

const toMigrationName = (fileName: string) => fileName.replace(/\.js$/, '.ts')

const toRuntimeFileName = (migrationName: string) =>
  migrationName.replace(/\.ts$/, RUNTIME_EXTENSION)

export const byFileName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })

export const listMigrationFiles = async () =>
  (await readdir(MIGRATIONS_DIRECTORY))
    .filter(isMigrationFile)
    .map(toMigrationName)
    .sort(byFileName)

export const loadMigration = async (fileName: string) => {
  const { default: migration } = await import(
    pathToFileURL(join(MIGRATIONS_DIRECTORY, toRuntimeFileName(fileName))).href
  )
  if (!isMigration(migration)) throw new Error(`${fileName} must default-export { up, down }`)
  return migration
}
