import type { RequestHandler } from 'express'
import type { UserRole } from '../../../contracts/user.js'
import { ForbiddenError, UnauthorizedError } from '../errors/appErrors.js'

export const requireRole =
  (...allowed: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError())
    if (!allowed.includes(req.user.role)) return next(new ForbiddenError('Insufficient role'))
    next()
  }
