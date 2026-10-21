import type { ErrorRequestHandler } from 'express'
import { AppError } from './appErrors.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}
