import express from 'express'
import cookieParser from 'cookie-parser'
import { config } from './config/index.js'
import { pool } from './database/connectionPool.js'
import { createUsersRepository } from './repositories/usersRepository.js'
import { createAuthService } from './services/authService.js'
import { buildGoogleAuthUrl, fetchGoogleProfile } from './auth/googleOAuth.js'
import { createAuthRoutes } from './routes/authRoutes.js'
import { UnauthorizedError } from './errors/appErrors.js'
import { errorHandler } from './errors/errorHandler.js'

export const app = express()

app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// TODO: replace with real authService
const authService = createAuthService({
  users: createUsersRepository(pool),
  fetchGoogleProfile,
})

app.use(
  '/auth',
  createAuthRoutes({
    googleOAuth: { getAuthorizationUrl: buildGoogleAuthUrl },
    authService,
    session: {
      setSessionCookie: () => {},
      clearSessionCookie: () => {},
    },
    requireAuth: () => {
      throw new UnauthorizedError() //TODO: replace placeholder
    },
    frontendUrl: config.frontendUrl,
  }),
)

app.use(errorHandler)
