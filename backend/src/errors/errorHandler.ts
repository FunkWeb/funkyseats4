import type { ErrorRequestHandler } from 'express'
import { AppError } from './appErrors.js'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    })
    return
  }

  console.error(err)

  res.status(500).json({
    error: 'Internal Server Error',
  })
}

export default errorHandler
