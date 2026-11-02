import { Router, type RequestHandler } from 'express'
import { requireRole } from '../auth/requireRole.js'
import type { RoomsService } from '../services/roomsService.js'
import type { SeatsService } from '../services/seatsService.js'
import { parseCreateRoom, parseUpdateRoom } from '../validation/roomRequests.js'
import { parseId } from '../validation/parsers.js'

export interface RoomsRoutesDeps {
  roomsService: Pick<RoomsService, 'findAll' | 'findById' | 'create' | 'update' | 'delete'>
  seatsService: Pick<SeatsService, 'findByRoom'>
  requireAuth: RequestHandler
}

export const createRoomsRoutes = ({ roomsService, seatsService, requireAuth }: RoomsRoutesDeps) => {
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
