import type { ErrorRequestHandler } from 'express'
import type { ErrorResponse } from '../../../contracts/error.js'
import { AppError } from './appErrors.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ errorMessage: error.message } satisfies ErrorResponse)
    return
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res
      .status(413)
      .json({ errorMessage: 'Uploaded icon must be 100 KB or smaller' } satisfies ErrorResponse)
    return
  }

  console.error(error)
  res.status(500).json({ errorMessage: 'Internal server error' } satisfies ErrorResponse)
}
