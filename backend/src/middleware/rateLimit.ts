import rateLimit from 'express-rate-limit'

const MINUTE = 60 * 1000

const createLimiter = (windowMs: number, limit: number) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false })

export const authLimiter = createLimiter(15 * MINUTE, 20)
export const apiLimiter = createLimiter(MINUTE, 100)
