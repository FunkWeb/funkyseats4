import { config } from '../config/index.js'
import { createPool } from './createPool.js'

export const pool = createPool(config.db)
