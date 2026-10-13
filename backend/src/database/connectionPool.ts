import mysql, { type PoolOptions } from 'mysql2/promise'
import { config } from '../config/index.js'

export const createPool = (connection: PoolOptions) =>
  mysql.createPool({ ...connection, namedPlaceholders: true, timezone: 'Z' })

export const pool = createPool(config.db)
