import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from '../errors/appErrors.js'

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = (req as unknown as { session?: { user?: unknown } }).session

  if (!session?.user) {
    return next(new UnauthorizedError())
  }

  next()
}
