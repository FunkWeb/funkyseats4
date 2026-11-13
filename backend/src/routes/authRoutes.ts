import { randomBytes } from 'node:crypto'
import { Router, type RequestHandler } from 'express'
import type { AuthService } from '../services/authService.js'
import type { Session } from '../auth/session.js'
import { ForbiddenError, ValidationError } from '../errors/appErrors.js'

const OAUTH_STATE_COOKIE = 'oauth_state'
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000
const OAUTH_STATE_COOKIE_PATH = '/auth/google/callback'

export interface AuthRoutesDeps {
  googleOAuth: {
    getAuthorizationUrl: (state: string) => string
  }
  authService: Pick<AuthService, 'loginWithGoogle' | 'logout'>
  session: Pick<Session, 'setSessionCookie' | 'clearSessionCookie' | 'readIdentity'>
  requireAuth: RequestHandler
  frontendUrl: string
  createState?: () => string
}

export const createAuthRoutes = ({
  googleOAuth,
  authService,
  session,
  requireAuth,
  frontendUrl,
  createState = () => randomBytes(32).toString('hex'),
}: AuthRoutesDeps) => {
  const router = Router()
  const oauthStateCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: OAUTH_STATE_COOKIE_PATH,
    maxAge: OAUTH_STATE_MAX_AGE,
  }

  router.get('/google', (_req, res) => {
    const state = createState()
    res.cookie(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions)
    res.redirect(googleOAuth.getAuthorizationUrl(state))
  })

  router.get('/google/callback', async (req, res) => {
    const state = req.query.state
    const cookieState = req.cookies[OAUTH_STATE_COOKIE]
    res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions)

    if (typeof state !== 'string' || !cookieState || state !== cookieState) {
      throw new ForbiddenError('Invalid OAuth state')
    }

    const code = (req.query as Record<string, unknown>).code
    if (typeof code !== 'string' || !code) {
      throw new ValidationError('Missing Google OAuth code')
    }

    session.setSessionCookie(res, await authService.loginWithGoogle(code))
    res.redirect(frontendUrl)
  })

  router.get('/me', requireAuth, (req, res) => {
    if (!req.user) throw new ForbiddenError('Authentication required')
    res.json(req.user)
  })

  router.post('/logout', async (req, res) => {
    const identity = session.readIdentity(req)
    if (identity) await authService.logout(identity)
    session.clearSessionCookie(res)
    res.sendStatus(204)
  })

  return router
}
