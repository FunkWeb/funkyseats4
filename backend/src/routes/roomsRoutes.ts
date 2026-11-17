import { Router, type RequestHandler } from 'express'
import { requireRole } from '../auth/requireRole.js'
import type { BookingsService } from '../services/bookingsService.js'
import type { RoomsService } from '../services/roomsService.js'
import type { SeatsService } from '../services/seatsService.js'
import { parseCreateRoom, parseUpdateRoom } from '../validation/roomRequests.js'
import { parseId, parseIsoDate } from '../validation/parsers.js'

export interface RoomsRoutesDeps {
  bookingsService: Pick<BookingsService, 'findForRoomOnDate'>
  roomsService: Pick<RoomsService, 'findAll' | 'findById' | 'create' | 'update' | 'delete'>
  seatsService: Pick<SeatsService, 'findByRoom'>
  requireAuth: RequestHandler
}

export const createRoomsRoutes = ({
  bookingsService,
  roomsService,
  seatsService,
  requireAuth,
}: RoomsRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (_req, res) => {
    res.json(await roomsService.findAll())
  })

  router.get('/:id', async (req, res) => {
    res.json(await roomsService.findById(parseId(req.params.id, 'id')))
  })

  router.get('/:id/seats', async (req, res) => {
    res.json(await seatsService.findByRoom(parseId(req.params.id, 'id')))
  })

  router.get('/:id/bookings', async (req, res) => {
    const roomId = parseId(req.params.id, 'id')
    const date = parseIsoDate(req.query.date, 'date')
    res.json(await bookingsService.findForRoomOnDate(roomId, date))
  })

  router.post('/', requireRole('ADMIN'), async (req, res) => {
    const id = await roomsService.create(parseCreateRoom(req.body))
    res.status(201).json({ id })
  })

  router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
    await roomsService.update(parseId(req.params.id, 'id'), parseUpdateRoom(req.body))
    res.sendStatus(204)
  })

  router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    await roomsService.delete(parseId(req.params.id, 'id'))
    res.sendStatus(204)
  })

  return router
}
