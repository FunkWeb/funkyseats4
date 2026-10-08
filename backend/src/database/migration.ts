import type { Connection } from 'mysql2/promise'

export interface Migration {
  up: (db: Connection) => Promise<void>
  down: (db: Connection) => Promise<void>
}
