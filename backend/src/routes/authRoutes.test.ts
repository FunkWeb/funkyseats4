import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, describe, it } from 'node:test'
import express, { type NextFunction, type Request, type Response } from 'express'
import type { UserDto } from '../../../contracts/user.js'
import { ForbiddenError } from '../errors/appErrors.js'
import { createAuthRoutes } from './authRoutes.js'

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

  app.use(
    '/auth',
    createAuthRoutes({
      googleOAuth: {
        getAuthorizationUrl: (state) =>
          `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`,
      },
      authService: {
        loginWithGoogle: async (code) => {
          assert.equal(code, 'google-code')
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
      frontendUrl: 'http://localhost:5173',
      createState: () => 'state-123',
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

  after(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })

  it('sets a short-lived OAuth state cookie and redirects to Google', async () => {
    const response = await fetch(`${baseUrl}/auth/google`, { redirect: 'manual' })
    const cookie = response.headers.get('set-cookie')

    assert.equal(response.status, 302)
    assert.equal(
      response.headers.get('location'),
      'https://accounts.google.com/o/oauth2/v2/auth?state=state-123',
    )
    assert.match(cookie ?? '', /oauth_state=state-123/)
    assert.match(cookie ?? '', /Max-Age=600/)
    assert.match(cookie ?? '', /HttpOnly/)
  })

  it('rejects a callback whose state does not match the cookie', async () => {
    const response = await fetch(`${baseUrl}/auth/google/callback?state=wrong&code=google-code`, {
      headers: { cookie: 'oauth_state=state-123' },
    })

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), { message: 'Invalid OAuth state' })
  })

  it('logs in on a valid callback, sets the session cookie, and redirects to the frontend', async () => {
    const response = await fetch(
      `${baseUrl}/auth/google/callback?state=state-123&code=google-code`,
      { headers: { cookie: 'oauth_state=state-123' }, redirect: 'manual' },
    )
    const cookie = response.headers.get('set-cookie')

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), 'http://localhost:5173')
    assert.match(cookie ?? '', /session=7/)
    assert.deepEqual(sessionCalls, ['set:7'])
  })

  it('returns the current user from the protected endpoint', async () => {
    const response = await fetch(`${baseUrl}/auth/me`)

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), user)
  })

  it('clears the session cookie and returns 204 on logout', async () => {
    const response = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' })

    assert.equal(response.status, 204)
    assert.match(response.headers.get('set-cookie') ?? '', /session=;/)
    assert.deepEqual(sessionCalls, ['set:7', 'clear'])
  })
})
