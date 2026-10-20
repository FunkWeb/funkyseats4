import express from 'express'
import { errorHandler } from './errors/errorHandler.js'

export const app = express()

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(errorHandler)
