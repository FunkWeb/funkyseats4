import type { RequestHandler } from 'express'

const HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
} as const

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.set(HEADERS)
  next()
}
