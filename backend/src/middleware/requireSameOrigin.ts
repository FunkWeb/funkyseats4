import type { RequestHandler } from 'express'
import { ForbiddenError } from '../errors/appErrors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const createRequireSameOrigin =
  (allowedOrigin: string): RequestHandler =>
  (req, _res, next) => {
    if (SAFE_METHODS.has(req.method) || req.get('origin') === allowedOrigin) return next()
    next(new ForbiddenError('Cross-origin request rejected'))
  }
