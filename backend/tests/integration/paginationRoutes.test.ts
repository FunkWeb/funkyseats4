import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import express, { type RequestHandler } from 'express'
import type { PaginatedResponse } from '../../../contracts/pagination.js'
import { errorHandler } from '../../src/errors/errorHandler.js'
import { createBookingsRoutes } from '../../src/routes/bookingsRoutes.js'
import { createUsersRoutes } from '../../src/routes/usersRoutes.js'
import type { BookingsService } from '../../src/services/bookingsService.js'
import type { UsersService } from '../../src/services/usersService.js'

const USER_ID = 9

describe('paginated routes', () => {
  let server: Server
  let baseUrl: string
  const requested: { page: number; pageSize: number }[] = []

  const respond = <T>(page: number, pageSize: number): PaginatedResponse<T> => {
    requested.push({ page, pageSize })
    return { items: [], total: 0, page, pageSize }
  }

  const usersService: Pick<UsersService, 'findAll' | 'updateRole'> = {
    findAll: async (page, pageSize) => respond(page, pageSize),
    updateRole: async () => {},
  }
  const bookingsService: Pick<BookingsService, 'create' | 'cancel' | 'findForUser'> = {
    findForUser: async (userId, page, pageSize) => {
      assert.equal(userId, USER_ID)
      return respond(page, pageSize)
    },
    create: async () => {
      throw new Error('not used')
    },
    cancel: async () => {},
  }
  const requireAuth: RequestHandler = (req, _res, next) => {
    req.user = {
      id: USER_ID,
      name: 'Admin',
      email: 'admin@example.com',
      avatarPath: null,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    }
    next()
  }

  before(async () => {
    const app = express()
    app.use('/users', createUsersRoutes({ usersService, requireAuth }))
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

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  beforeEach(() => {
    requested.length = 0
  })

  for (const path of ['/users', '/bookings/me']) {
    describe(`GET ${path}`, () => {
      it('defaults to page 1 with 20 items per page', async () => {
        const response = await fetch(`${baseUrl}${path}`)

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { items: [], total: 0, page: 1, pageSize: 20 })
        assert.deepEqual(requested, [{ page: 1, pageSize: 20 }])
      })

      it('passes the requested page and page size to the service', async () => {
        const response = await fetch(`${baseUrl}${path}?page=3&pageSize=100`)

        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { items: [], total: 0, page: 3, pageSize: 100 })
        assert.deepEqual(requested, [{ page: 3, pageSize: 100 }])
      })

      for (const query of [
        'pageSize=101',
        'pageSize=0',
        'pageSize=abc',
        'page=0',
        'page=-1',
        'page=1.5',
        'page=',
        'page=1&page=2',
      ]) {
        it(`rejects ${query}`, async () => {
          const response = await fetch(`${baseUrl}${path}?${query}`)

          assert.equal(response.status, 400)
          assert.deepEqual(requested, [])
        })
      }
    })
  }
})
