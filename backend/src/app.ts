import express from 'express'
import cookieParser from 'cookie-parser'
import { config } from './config/index.js'
import { pool } from './database/connectionPool.js'
import { createUsersRepository } from './repositories/usersRepository.js'
import { createBookingsRepository } from './repositories/bookingsRepository.js'
import { createSeatsRepository } from './repositories/seatsRepository.js'
import { createRoomsRepository } from './repositories/roomsRepository.js'
import { createFeaturesRepository } from './repositories/featuresRepository.js'
import { createAuthService } from './services/authService.js'
import { createBookingsService } from './services/bookingsService.js'
import { createFeaturesService } from './services/featuresService.js'
import { createSeatsService } from './services/seatsService.js'
import { createUsersService } from './services/usersService.js'
import { buildGoogleAuthUrl, fetchGoogleProfile } from './auth/googleOAuth.js'
import { createAuthRoutes } from './routes/authRoutes.js'
import { createBookingsRoutes } from './routes/bookingsRoutes.js'
import { createFeaturesRoutes } from './routes/featuresRoutes.js'
import { createSeatsRoutes } from './routes/seatsRoutes.js'
import { createUsersRoutes } from './routes/usersRoutes.js'
import { errorHandler } from './errors/errorHandler.js'
import { createSession } from './auth/session.js'
import { createRequireAuth } from './auth/requireAuth.js'
import { requireRole } from './auth/requireRole.js'
import { apiLimiter, authLimiter } from './middleware/rateLimit.js'

export const app = express()

app.set('trust proxy', 2)
app.use(cookieParser())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const users = createUsersRepository(pool)
const seats = createSeatsRepository(pool)
const rooms = createRoomsRepository(pool)
const features = createFeaturesRepository(pool)

const session = createSession({ ...config.session, secure: config.isProduction })
const requireAuth = createRequireAuth({ session, users })

const authService = createAuthService({ users, fetchGoogleProfile })
const bookingsService = createBookingsService({
  bookings: createBookingsRepository(pool),
  seats,
  rooms,
})
const seatsService = createSeatsService({ seats, rooms, features })
const featuresService = createFeaturesService({ features })
const usersService = createUsersService({ users })

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
app.use('/features', apiLimiter, createFeaturesRoutes({ featuresService, requireAuth }))
app.use('/users', apiLimiter, createUsersRoutes({ usersService, requireAuth }))
app.use('/seats', apiLimiter, createSeatsRoutes({ seatsService, requireAuth, requireRole }))

app.use(errorHandler)
