import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { GoogleProfile } from '../../src/auth/googleOAuth.js'
import { createRequireAuth } from '../../src/auth/requireAuth.js'
import { createSession } from '../../src/auth/session.js'
import { errorHandler } from '../../src/errors/errorHandler.js'
import { createUsersRepository } from '../../src/repositories/usersRepository.js'
import { createAuthRoutes } from '../../src/routes/authRoutes.js'
import { createAuthService } from '../../src/services/authService.js'
import { useMigratedTestDatabase } from '../testDatabase.js'
import { createFixtures, type Fixtures } from '../testFixtures.js'

const OAUTH_STATE = 'oauth-state'

const fetchGoogleProfile = async (code: string): Promise<GoogleProfile> => ({
  googleId: `google-${code}`,
  name: code,
  email: `${code}@example.com`,
  avatarPath: null,
})

describe('auth session', () => {
  const db = useMigratedTestDatabase()
  let fixtures: Fixtures
  let server: Server
  let baseUrl: string

  const request = (path: string, method: string, cookie?: string) =>
    fetch(`${baseUrl}${path}`, {
      method,
      redirect: 'manual',
      headers: cookie ? { cookie } : {},
    })

  const login = async (name: string) => {
    const response = await request(
      `/auth/google/callback?state=${OAUTH_STATE}&code=${name}`,
      'GET',
      `oauth_state=${OAUTH_STATE}`,
    )
    const sessionCookie = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .find((cookie) => cookie.startsWith('session='))
    assert.ok(sessionCookie, 'login should set a session cookie')
    return sessionCookie
  }

  const me = (cookie?: string) => request('/auth/me', 'GET', cookie)
  const logout = (cookie?: string) => request('/auth/logout', 'POST', cookie)

  before(async () => {
    fixtures = createFixtures(db())
    const users = createUsersRepository(db())
    const session = createSession({
      secret: 'session-secret-of-32-characters!!',
      lifetimeMinutes: 5,
      secure: false,
    })

    const app = express()
    app.use(cookieParser())
    app.use(
      '/auth',
      createAuthRoutes({
        googleOAuth: { getAuthorizationUrl: (state) => `https://accounts.example/?state=${state}` },
        authService: createAuthService({ users, fetchGoogleProfile }),
        session,
        requireAuth: createRequireAuth({ session, users }),
        frontendUrl: 'http://frontend.example',
      }),
    )
    app.use(errorHandler)

    server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  after(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(async () => {
    await fixtures.reset()
  })

  it('login gives access to the signed-in user', async () => {
    const response = await me(await login('alice'))

    assert.equal(response.status, 200)
    assert.partialDeepStrictEqual(await response.json(), { email: 'alice@example.com' })
  })

  it('requests without a session are rejected', async () => {
    assert.equal((await me()).status, 401)
  })

  it('logout rejects the session cookie it was called with', async () => {
    const cookie = await login('alice')

    assert.equal((await logout(cookie)).status, 204)
    assert.equal((await me(cookie)).status, 401)
  })

  it('logout ends every session of that user', async () => {
    const first = await login('alice')
    const second = await login('alice')

    await logout(first)

    assert.equal((await me(second)).status, 401)
  })

  it('logout leaves other users signed in', async () => {
    const alice = await login('alice')
    const bob = await login('bob')

    await logout(alice)

    assert.equal((await me(bob)).status, 200)
  })

  it('logging in again after logout gives a working session', async () => {
    await logout(await login('alice'))

    assert.equal((await me(await login('alice'))).status, 200)
  })

  it('logout with an already revoked cookie does not end newer sessions', async () => {
    const revoked = await login('alice')
    await logout(revoked)
    const current = await login('alice')

    assert.equal((await logout(revoked)).status, 204)
    assert.equal((await me(current)).status, 200)
  })

  it('logout without a session succeeds', async () => {
    assert.equal((await logout()).status, 204)
  })
})
