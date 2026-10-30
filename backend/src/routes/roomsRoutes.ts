import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import type { RoomsService } from '../services/roomsService.js'
import type { CreateRoomRequest, UpdateRoomRequest } from '../../../contracts/room.js'
import { NotFoundError } from '../errors/appErrors.js'

export const createRoomsRoutes = ({
  roomsService,
  requireAuth,
  requireRole,
}: {
  roomsService: RoomsService
  requireAuth: RequestHandler
  requireRole: (...allowed: ('CANDIDATE' | 'SUPERVISOR' | 'ADMIN')[]) => RequestHandler
}) => {
  const router = Router()

  router.use(requireAuth)

  router.get('/', (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rooms = await roomsService.findAll()
      return res.json(rooms)
    } catch (error) {
      next(error)
    }
  }) as RequestHandler)

  router.get('/:id', (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      const room = await roomsService.findById(id)

      if (!room) {
        return res.status(404).send()
      }

      return res.json(room)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).send()
      }
      next(error)
    }
  }) as RequestHandler)

  router.post('/', requireRole('ADMIN'), (async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body: CreateRoomRequest = req.body
      const created = await roomsService.create(body)

      return res.status(201).json({ id: created })
    } catch (error) {
      next(error)
    }
  }) as RequestHandler)

  router.patch('/:id', requireRole('ADMIN'), (async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = Number(req.params.id)
      const body: UpdateRoomRequest = req.body

      await roomsService.update(id, body)
      return res.status(204).send()
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).send()
      }
      next(error)
    }
  }) as RequestHandler)

  router.delete('/:id', requireRole('ADMIN'), (async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = Number(req.params.id)

      await roomsService.delete(id)
      return res.status(204).send()
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).send()
      }
      next(error)
    }
  }) as RequestHandler)

  return router
}
