import { Router, type RequestHandler } from 'express'
import type { UserRole } from '../../../contracts/user.js'
import type { SeatsService } from '../services/seatsService.js'
import { parseCreateSeat, parseUpdateSeat } from '../validation/seatRequests.js'
import { parseId } from '../validation/parsers.js'

export interface SeatsRoutesDeps {
  seatsService: Pick<
    SeatsService,
    | 'findByRoom'
    | 'create'
    | 'update'
    | 'delete'
    | 'findFeatures'
    | 'attachFeature'
    | 'detachFeature'
  >
  requireAuth: RequestHandler
  requireRole: (...roles: UserRole[]) => RequestHandler
}

export const createSeatsRoutes = ({ seatsService, requireAuth, requireRole }: SeatsRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.post('/', requireRole('ADMIN'), async (req, res) => {
    const id = await seatsService.create(parseCreateSeat(req.body))
    res.status(201).json({ id })
  })

  router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
    await seatsService.update(parseId(req.params.id, 'id'), parseUpdateSeat(req.body))
    res.sendStatus(204)
  })

  router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    await seatsService.delete(parseId(req.params.id, 'id'))
    res.sendStatus(204)
  })

  router.get('/:id/features', async (req, res) => {
    res.json(await seatsService.findFeatures(parseId(req.params.id, 'id')))
  })

  router.put('/:id/features/:featureId', requireRole('ADMIN'), async (req, res) => {
    await seatsService.attachFeature(
      parseId(req.params.id, 'id'),
      parseId(req.params.featureId, 'featureId'),
    )
    res.sendStatus(204)
  })

  router.delete('/:id/features/:featureId', requireRole('ADMIN'), async (req, res) => {
    await seatsService.detachFeature(
      parseId(req.params.id, 'id'),
      parseId(req.params.featureId, 'featureId'),
    )
    res.sendStatus(204)
  })

  return router
}
