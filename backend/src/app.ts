import express from 'express'
import cookieParser from 'cookie-parser'
import { config } from './config/index.js'
import { pool } from './database/connectionPool.js'
import { createUsersRepository } from './repositories/usersRepository.js'
import { createBookingsRepository } from './repositories/bookingsRepository.js'
import { createSeatsRepository } from './repositories/seatsRepository.js'
import { createRoomsRepository } from './repositories/roomsRepository.js'
import { createAuthService } from './services/authService.js'
import { createBookingsService } from './services/bookingsService.js'
import { buildGoogleAuthUrl, fetchGoogleProfile } from './auth/googleOAuth.js'
import { createAuthRoutes } from './routes/authRoutes.js'
import { createBookingsRoutes } from './routes/bookingsRoutes.js'
import { errorHandler } from './errors/errorHandler.js'
import { createSession } from './auth/session.js'
import { createRequireAuth } from './auth/requireAuth.js'
import { apiLimiter, authLimiter } from './middleware/rateLimit.js'

export const app = express()

app.set('trust proxy', 2)
app.use(cookieParser())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const users = createUsersRepository(pool)
const session = createSession({ ...config.session, secure: config.isProduction })
const requireAuth = createRequireAuth({ session, users })
const authService = createAuthService({ users, fetchGoogleProfile })
const bookingsService = createBookingsService({
  bookings: createBookingsRepository(pool),
  seats: createSeatsRepository(pool),
  rooms: createRoomsRepository(pool),
})

app.use(
  '/auth',
  authLimiter,
  createAuthRoutes({
    googleOAuth: { getAuthorizationUrl: buildGoogleAuthUrl },
    authService,
    session,
    requireAuth,
    frontendUrl: config.frontendUrl,
  }),
)

app.use('/bookings', apiLimiter, createBookingsRoutes({ bookingsService, requireAuth }))

app.use(errorHandler)
