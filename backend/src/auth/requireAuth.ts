import { UnauthorizedError } from '../errors/appErrors.js'
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/appErrors.js'

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = (req as Record<string, any>).session

  if (!session?.user) {
    return next(new UnauthorizedError())
  }

  next()
}
