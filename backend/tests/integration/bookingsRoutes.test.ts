import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import express, { type RequestHandler } from 'express'
import type { BookingFilters } from '../../../contracts/booking.js'
import type { Pagination } from '../../../contracts/pagination.js'
import { UnauthorizedError } from '../../src/errors/appErrors.js'
import { errorHandler } from '../../src/errors/errorHandler.js'
import { createBookingsRoutes, type BookingsRoutesDeps } from '../../src/routes/bookingsRoutes.js'

describe('bookingsRoutes admin bookings', () => {
  let server: Server
  let baseUrl: string
  let loggedIn = true
  let currentRole: 'ADMIN' | 'CANDIDATE' | 'SUPERVISOR' = 'ADMIN'
  const requests: { filters: BookingFilters; pagination: Pagination }[] = []
  const cancellations: { actorId: number; role: string; bookingId: number }[] = []

  const bookingsService: BookingsRoutesDeps['bookingsService'] = {
    create: async () => {
      throw new Error('not used')
    },
    cancel: async (actor, bookingId) => {
      cancellations.push({ actorId: actor.id, role: actor.role, bookingId })
    },
    findForUser: async () => {
      throw new Error('not used')
    },
    getStatsForUser: async () => {
      throw new Error('not used')
    },
    findAll: async (filters, pagination) => {
      requests.push({ filters, pagination })
      return { ...pagination, total: 0, items: [] }
    },
  }

  const requireAuth: RequestHandler = (req, _res, next) => {
    if (!loggedIn) return next(new UnauthorizedError())
    req.user = {
      id: 9,
      name: 'Test User',
      email: 'test@example.com',
      avatarPath: null,
      role: currentRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    }
    next()
  }

  before(async () => {
    const app = express()
    app.use('/bookings', createBookingsRoutes({ bookingsService, requireAuth }))
    app.use(errorHandler)
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address()
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`
        resolve()
      })
    })
  })

  beforeEach(() => {
    loggedIn = true
    currentRole = 'ADMIN'
    requests.length = 0
    cancellations.length = 0
  })

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('lists bookings for admins and parses pagination and all filters', async () => {
    const response = await fetch(
      `${baseUrl}/bookings?fromDate=2030-01-02&roomId=2&userId=9&status=ACTIVE&page=3&pageSize=10`,
    )

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { page: 3, pageSize: 10, total: 0, items: [] })
    assert.deepEqual(requests, [
      {
        filters: { fromDate: '2030-01-02', roomId: 2, userId: 9, status: 'ACTIVE' },
        pagination: { page: 3, pageSize: 10 },
      },
    ])
  })

  for (const role of ['CANDIDATE', 'SUPERVISOR'] as const) {
    it(`rejects ${role} users with 403`, async () => {
      currentRole = role
      const response = await fetch(`${baseUrl}/bookings`)
      assert.equal(response.status, 403)
      assert.deepEqual(requests, [])
    })
  }

  it('rejects unauthenticated requests with 401', async () => {
    loggedIn = false
    const response = await fetch(`${baseUrl}/bookings`)
    assert.equal(response.status, 401)
    assert.deepEqual(requests, [])
  })

  for (const query of [
    'fromDate=2030-02-30',
    'fromDate=2030-99-99',
    'roomId=0',
    'roomId=abc',
    'userId=-1',
    'status=UNKNOWN',
  ]) {
    it(`rejects invalid filter ${query} with 400`, async () => {
      const response = await fetch(`${baseUrl}/bookings?${query}`)
      assert.equal(response.status, 400)
      assert.deepEqual(requests, [])
    })
  }

  it('passes the authenticated user to cancellation', async () => {
    const response = await fetch(`${baseUrl}/bookings/17/cancel`, { method: 'POST' })
    assert.equal(response.status, 204)
    assert.deepEqual(cancellations, [{ actorId: 9, role: 'ADMIN', bookingId: 17 }])
  })
})
