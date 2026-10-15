import { after, before, describe, it } from 'node:test'
import mysql, { type Connection } from 'mysql2/promise'
import {
  apply,
  ensureMigrationsTable,
  listMigrationFiles,
  revert,
} from '../../src/database/migration-runner/index.js'
import { readTestDbConfig } from '../testDatabase.js'