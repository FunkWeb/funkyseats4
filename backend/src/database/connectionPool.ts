import mysql from 'mysql2/promise'
import { env } from '../config.js'

export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  namedPlaceholders: true,
  timezone: 'Z',
})
