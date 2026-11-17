import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import express, { type RequestHandler } from 'express'
import type { BookingDto } from '../../../contracts/booking.js'
import type { RoomDto } from '../../../contracts/room.js'
import { NotFoundError } from '../../src/errors/appErrors.js'
import { errorHandler } from '../../src/errors/errorHandler.js'
import { createRoomsRoutes } from '../../src/routes/roomsRoutes.js'
import type { BookingsService } from '../../src/services/bookingsService.js'
import type { RoomsService } from '../../src/services/roomsService.js'
import type { SeatsService } from '../../src/services/seatsService.js'

const ROOM_ID = 12
const DATE = '2030-01-02'

describe('roomsRoutes /rooms/:id/bookings', () => {
  let server: Server
  let baseUrl: string
  let isAuthenticated = true
  const requested: { roomId: number; date: string }[] = []
  const booking: BookingDto = {
    id: 5,
    seatId: 7,
    userId: 9,
    status: 'ACTIVE',
    bookingDate: DATE,
    timePeriod: 'BEFORE_LUNCH',
  }

  const bookingsService: Pick<BookingsService, 'findForRoomOnDate'> = {
    findForRoomOnDate: async (roomId, date) => {
      requested.push({ roomId, date })
      if (roomId !== ROOM_ID) throw new NotFoundError('Room')
      return [booking]
    },
  }
  const roomsService: Pick<RoomsService, 'findAll' | 'findById' | 'create' | 'update' | 'delete'> =
    {
      findAll: async () => [],
      findById: async (): Promise<RoomDto> => ({
        id: ROOM_ID,
        slug: 'room-a',
        name: 'Room A',
        description: null,
        seatMapPath: null,
        maxDaysAhead: 3,
      }),
      create: async () => ROOM_ID,
      update: async () => {},
      delete: async () => {},
    }
  const seatsService: Pick<SeatsService, 'findByRoom'> = {
    findByRoom: async () => [],
  }
  const requireAuth: RequestHandler = (_req, res, next) => {
    if (!isAuthenticated) {
      res.sendStatus(401)
      return
    }
    next()
  }

  before(async () => {
    const app = express()
    app.use(
      '/rooms',
      createRoomsRoutes({ bookingsService, roomsService, seatsService, requireAuth }),
    )
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

  it('returns room bookings and passes the parsed room id and date to the service', async () => {
    const response = await fetch(`${baseUrl}/rooms/${ROOM_ID}/bookings?date=${DATE}`)

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [booking])
    assert.deepEqual(requested.at(-1), { roomId: ROOM_ID, date: DATE })
  })

  it('requires authentication', async () => {
    isAuthenticated = false
    try {
      const response = await fetch(`${baseUrl}/rooms/${ROOM_ID}/bookings?date=${DATE}`)
      assert.equal(response.status, 401)
    } finally {
      isAuthenticated = true
    }
  })

  it('rejects a missing or invalid date', async () => {
    for (const path of [
      `/rooms/${ROOM_ID}/bookings`,
      `/rooms/${ROOM_ID}/bookings?date=2030-02-30`,
    ]) {
      const response = await fetch(`${baseUrl}${path}`)
      assert.equal(response.status, 400, path)
    }
  })

  it('returns 404 when the room does not exist', async () => {
    const response = await fetch(`${baseUrl}/rooms/13/bookings?date=${DATE}`)

    assert.equal(response.status, 404)
  })
})
