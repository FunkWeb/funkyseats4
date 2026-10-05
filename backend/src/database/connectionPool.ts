import mysql from 'mysql2/promise'
import { config } from '../config.js'

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  namedPlaceholders: true,
  timezone: 'Z',
})
