import { after, before, describe, it } from 'node:test'
import mysql, { type Connection } from 'mysql2/promise'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
  revert,
} from '../../src/database/migration-runner/index.js'
import { readTestDbConfig } from '../testDatabase.js'

const migrationFiles = await listMigrationFiles()

describe('migrations', () => {
  const { database, server } = readTestDbConfig()
  const escapedDb = mysql.escapeId(database)
  let admin: Connection | undefined
  let conn: Connection | undefined
  let previousFailed = false

  before(async () => {
    admin = await mysql.createConnection(server)
    await admin.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin.query(`CREATE DATABASE ${escapedDb}`)
    conn = await mysql.createConnection({ ...server, database })
    await ensureMigrationsTable(conn)
  })

  after(async () => {
    await conn?.end()
    await admin?.query(`DROP DATABASE IF EXISTS ${escapedDb}`)
    await admin?.end()
  })

  for (const fileName of migrationFiles) {
    it(`${fileName} applies, reverts idempotently and reapplies`, async (t) => {
      if (previousFailed) return t.skip('previous migration failed')
      try {
        await apply(conn!, fileName)
        await revert(conn!, fileName)
        await revert(conn!, fileName)
        await apply(conn!, fileName)
      } catch (error) {
        previousFailed = true
        throw error
      }
    })
  }
})