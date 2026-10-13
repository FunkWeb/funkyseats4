import mysql, { type PoolOptions } from 'mysql2/promise'

export const createPool = (connection: PoolOptions) =>
  mysql.createPool({ ...connection, namedPlaceholders: true, timezone: 'Z' })
