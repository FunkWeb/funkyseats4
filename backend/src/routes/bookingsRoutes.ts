import { Router, type RequestHandler } from 'express'
import { currentUser } from '../auth/requireAuth.js'
import type { BookingsService } from '../services/bookingsService.js'
import { parseNewBooking } from '../validation/bookingRequests.js'
import { parseId } from '../validation/parsers.js'

export interface BookingsRoutesDeps {
  bookingsService: Pick<BookingsService, 'create' | 'cancel' | 'findForUser'>
  requireAuth: RequestHandler
}

export const createBookingsRoutes = ({ bookingsService, requireAuth }: BookingsRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.get('/me', async (req, res) => {
    res.json(await bookingsService.findForUser(currentUser(req).id))
  })

  router.post('/', async (req, res) => {
    const booking = await bookingsService.create(currentUser(req).id, parseNewBooking(req.body))
    res.status(201).json(booking)
  })

  router.post('/:id/cancel', async (req, res) => {
    await bookingsService.cancel(currentUser(req).id, parseId(req.params.id, 'id'))
    res.sendStatus(204)
  })

  return router
}
