import { createConnection, type Connection } from 'mysql2/promise'
import { createDbConfig } from '../../config/createConfig.js'
import {
  apply,
  ensureMigrationsTable,
  fileNamesIn,
  findLastApplied,
  findStatus,
  revert,
  withMigrationLock,
} from './index.js'

const migrateUp = async (db: Connection) => {
  const statuses = await findStatus(db)
  for (const fileName of fileNamesIn(statuses, 'missing')) {
    console.warn(`Warning: ${fileName} is recorded as applied but its file is missing`)
  }
  const pending = fileNamesIn(statuses, 'pending')
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

const formatAppliedAt = (appliedAt?: Date) => appliedAt?.toLocaleString('sv-SE') ?? ''

const migrateStatus = async (db: Connection) => {
  const statuses = await findStatus(db)
  if (statuses.length === 0) {
    console.log('No migrations')
    return
  }
  const fileNameWidth = Math.max(...statuses.map(({ fileName }) => fileName.length))
  for (const { fileName, state, appliedAt } of statuses) {
    console.log(
      `${state.padEnd(8)} ${fileName.padEnd(fileNameWidth)}  ${formatAppliedAt(appliedAt)}`.trimEnd(),
    )
  }
}

const commands = new Map([
  ['up', migrateUp],
  ['down', migrateDown],
  ['status', migrateStatus],
])

const main = async () => {
  const commandName = process.argv[2] ?? 'up'
  const command = commands.get(commandName)
  if (!command)
    throw new Error(
      `Unknown command "${commandName}". Use one of: ${[...commands.keys()].join(', ')}`,
    )

  const db = await createConnection(createDbConfig(process.env))
  try {
    await withMigrationLock(db, async () => {
      await ensureMigrationsTable(db)
      await command(db)
    })
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
