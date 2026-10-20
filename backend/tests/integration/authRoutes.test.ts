import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, beforeEach, describe, it } from 'node:test'
import express, { type NextFunction, type Request, type Response } from 'express'
import type { UserDto } from '../../../contracts/user.js'
import { ForbiddenError } from '../../src/errors/appErrors.js'
import { createAuthRoutes } from '../../src/routes/authRoutes.js'

const AUTH_BASE_PATH = '/auth'
const GOOGLE_CODE = 'google-code'
const OAUTH_STATE = 'state-123'
const OAUTH_STATE_COOKIE = `oauth_state=${OAUTH_STATE}`
const FRONTEND_URL = 'http://localhost:5173'

const user: UserDto = {
  id: 7,
  name: 'Alex Candidate',
  email: 'alex@example.com',
  avatarPath: null,
  role: 'CANDIDATE',
  lastLoginAt: null,
  updatedAt: '2026-10-19T12:00:00.000Z',
  createdAt: '2026-10-19T12:00:00.000Z',
}

describe('auth routes', () => {
  const app = express()
  let server: Server
  let baseUrl: string
  const sessionCalls: string[] = []
  const authUrl = (path: string) => `${baseUrl}${AUTH_BASE_PATH}/${path}`
  const callbackUrl = (state: string) =>
    `${authUrl('google/callback')}?${new URLSearchParams({ state, code: GOOGLE_CODE })}`

  app.use(
    AUTH_BASE_PATH,
    createAuthRoutes({
      googleOAuth: {
        getAuthorizationUrl: (state) =>
          `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`,
      },
      authService: {
        loginWithGoogle: async (code) => {
          assert.equal(code, GOOGLE_CODE)
          return user
        },
      },
      session: {
        setSessionCookie: (res, userId) => {
          sessionCalls.push(`set:${userId}`)
          res.cookie('session', String(userId))
        },
        clearSessionCookie: (res) => {
          sessionCalls.push('clear')
          res.clearCookie('session')
        },
      },
      requireAuth: (req, _res, next) => {
        req.user = user
        next()
      },
      frontendUrl: FRONTEND_URL,
      createState: () => OAUTH_STATE,
    }),
  )
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(error instanceof ForbiddenError ? 403 : 500).json({ message: error.message })
  })

  before(async () => {
    server = createServer(app)
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Could not bind test server')
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  beforeEach(() => {
    sessionCalls.length = 0
  })

  after(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })

  it('sets a short-lived OAuth state cookie and redirects to Google', async () => {
    const response = await fetch(authUrl('google'), { redirect: 'manual' })
    const cookie = response.headers.get('set-cookie')

    assert.equal(response.status, 302)
    assert.equal(
      response.headers.get('location'),
      `https://accounts.google.com/o/oauth2/v2/auth?state=${OAUTH_STATE}`,
    )
    assert.match(cookie ?? '', new RegExp(`oauth_state=${OAUTH_STATE}`))
    assert.match(cookie ?? '', /Max-Age=600/)
    assert.match(cookie ?? '', /HttpOnly/)
  })

  it('rejects a callback whose state does not match the cookie', async () => {
    const response = await fetch(callbackUrl('wrong'), {
      headers: { cookie: OAUTH_STATE_COOKIE },
    })

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { message: 'Invalid OAuth state' })
  })

  it('logs in on a valid callback, sets the session cookie, and redirects to the frontend', async () => {
    const response = await fetch(callbackUrl(OAUTH_STATE), {
      headers: { cookie: OAUTH_STATE_COOKIE },
      redirect: 'manual',
    })
    const cookie = response.headers.get('set-cookie')

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), FRONTEND_URL)
    assert.match(cookie ?? '', /session=7/)
    assert.deepEqual(sessionCalls, ['set:7'])
  })

  it('returns the current user from the protected endpoint', async () => {
    const response = await fetch(authUrl('me'))

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), user)
  })

  it('clears the session cookie and returns 204 on logout', async () => {
    const response = await fetch(authUrl('logout'), { method: 'POST' })

    assert.equal(response.status, 204)
    assert.match(response.headers.get('set-cookie') ?? '', /session=;/)
    assert.deepEqual(sessionCalls, ['clear'])
  })
})
