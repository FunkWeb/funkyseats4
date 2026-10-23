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
import { createSession } from './auth/session.js'

export const app = express()

app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const authService = createAuthService({
  users: createUsersRepository(pool),
  fetchGoogleProfile,
})

app.use(
  '/auth',
  createAuthRoutes({
    googleOAuth: { getAuthorizationUrl: buildGoogleAuthUrl },
    authService,
    session: createSession({ ...config.session, secure: config.isProduction }),
    requireAuth: () => {
      throw new UnauthorizedError()
    },
    frontendUrl: config.frontendUrl,
  }),
)

app.use(errorHandler)
