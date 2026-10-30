import { Router, type RequestHandler } from 'express'
import type { CreateSeatRequest, UpdateSeatRequest } from '../../../contracts/seat.js'
import type { UserRole } from '../../../contracts/user.js'
import { ValidationError } from '../errors/appErrors.js'
import type { SeatsService } from '../services/seatsService.js'
import { asRecord, parseId } from '../validation/parsers.js'

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

const parseSeatNumber = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 10)
    throw new ValidationError('seatNumber must be a non-empty string of at most 10 characters')
  return value
}

const parseDescription = (value: unknown): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new ValidationError('description must be a string or null')
  return value
}

export const createSeatsRoutes = ({ seatsService, requireAuth, requireRole }: SeatsRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (req, res) => {
    res.json(await seatsService.findByRoom(parseId(req.query.roomId, 'roomId')))
  })

  router.post('/', requireRole('ADMIN'), async (req, res) => {
    const body = asRecord(req.body)
    const seat: CreateSeatRequest = {
      roomId: parseId(body.roomId, 'roomId'),
      seatNumber: parseSeatNumber(body.seatNumber),
      description: parseDescription(body.description),
    }
    const id = await seatsService.create(seat)
    res.status(201).json({ id })
  })

  router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
    const body = asRecord(req.body)
    const seat: UpdateSeatRequest = {}
    if (body.roomId !== undefined) seat.roomId = parseId(body.roomId, 'roomId')
    if (body.seatNumber !== undefined) seat.seatNumber = parseSeatNumber(body.seatNumber)
    if (body.description !== undefined) seat.description = parseDescription(body.description)

    await seatsService.update(parseId(req.params.id, 'id'), seat)
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
