import type { ErrorRequestHandler } from 'express'
import type { ErrorResponse } from '../../../contracts/error.js'
import { AppError } from './appErrors.js'

export const isEntityTooLarge = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'type' in error &&
  error.type === 'entity.too.large'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ errorMessage: error.message } satisfies ErrorResponse)
    return
  }

  if (isEntityTooLarge(error)) {
    res.status(413).json({ errorMessage: 'Request body is too large' } satisfies ErrorResponse)
    return
  }

  console.error(error)
  res.status(500).json({ errorMessage: 'Internal server error' } satisfies ErrorResponse)
}
