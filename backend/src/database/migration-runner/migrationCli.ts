import { createConnection, type Connection } from 'mysql2/promise'
import { createDbConfig } from '../../config/createConfig.js'
import { apply, ensureMigrationsTable, findLastApplied, findPending, revert } from './migrationRunner.js'

const migrateUp = async (db: Connection) => {
  const pending = await findPending(db)
  for (const fileName of pending) {
    await apply(db, fileName)
    console.log(`Completed: ${fileName}`)
  }
  if (pending.length === 0) console.log('Up to date')
}

const migrateDown = async (db: Connection) => {
  const fileName = await findLastApplied(db)
  if (!fileName) {
    console.log('Nothing to roll back')
    return
  }
  await revert(db, fileName)
  console.log(`Rolled Back: ${fileName}`)
}

const commands = new Map([
  ['up', migrateUp],
  ['down', migrateDown],
])

const main = async () => {
  const commandName = process.argv[2] ?? 'up'
  const command = commands.get(commandName)
  if (!command) throw new Error(`Unknown command "${commandName}". Use "up" or "down".`)

  const db = await createConnection(createDbConfig(process.env))
  try {
    await ensureMigrationsTable(db)
    await command(db)
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
