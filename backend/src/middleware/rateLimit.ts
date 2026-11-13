import type { Request } from 'express'
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit'

const MINUTE = 60 * 1000

const createLimiter = (windowMs: number, limit: number, options: Partial<Options> = {}) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, ...options })

export const authLimiter = createLimiter(15 * MINUTE, 300)

export const createApiLimiter = (readUserId: (req: Request) => number | null) =>
  createLimiter(MINUTE, 100, {
    keyGenerator: (req) => {
      const userId = readUserId(req)
      return userId === null ? ipKeyGenerator(req.ip ?? '') : `user:${userId}`
    },
  })
