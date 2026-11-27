import { Router, type RequestHandler } from 'express'
import { isValidSeatMapPath } from '../../../contracts/room.js'
import { requireRole } from '../auth/requireRole.js'
import { ValidationError } from '../errors/appErrors.js'
import { rawUpload } from '../middleware/rawUpload.js'
import type { BookingsService } from '../services/bookingsService.js'
import type { RoomsService } from '../services/roomsService.js'
import type { SeatsService } from '../services/seatsService.js'
import {
  parseCreateRoom,
  parseUpdateRoom,
  validateSeatMapContent,
  type SeatMapExtension,
} from '../validation/roomRequests.js'
import { parseId, parseIsoDate } from '../validation/parsers.js'

export interface RoomsRoutesDeps {
  bookingsService: Pick<BookingsService, 'findForRoomOnDate'>
  roomsService: Pick<
    RoomsService,
    'findAll' | 'findById' | 'create' | 'update' | 'delete' | 'saveSeatMap' | 'discardSeatMap'
  >
  seatsService: Pick<SeatsService, 'findByRoom'>
  requireAuth: RequestHandler
}

const uploadSeatMap = rawUpload({
  types: new Map<string, SeatMapExtension>([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
  ]),
  limit: 2 * 1024 * 1024,
  tooLargeMessage: 'Uploaded seat map must be 2 MB or smaller',
})

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

  router.post('/seat-maps', requireRole('ADMIN'), ...uploadSeatMap, (async (req, res) => {
    const ext = res.locals.uploadExtension as SeatMapExtension
    const content = validateSeatMapContent(req.body, ext)
    res.status(201).json({ seatMapPath: await roomsService.saveSeatMap(content, ext) })
  }) satisfies RequestHandler)

  router.delete('/seat-maps/:filename', requireRole('ADMIN'), async (req, res) => {
    const seatMapPath = `/seat-maps/${req.params.filename}`
    if (!isValidSeatMapPath(seatMapPath)) throw new ValidationError('Invalid seat map filename')
    await roomsService.discardSeatMap(seatMapPath)
    res.sendStatus(204)
  })

  return router
}
