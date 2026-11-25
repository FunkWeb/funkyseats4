import { Router, type RequestHandler } from 'express'
import { currentUser } from '../auth/requireAuth.js'
import { requireRole } from '../auth/requireRole.js'
import type { BookingsService } from '../services/bookingsService.js'
import { parseAdminBookingFilters, parseNewBooking } from '../validation/bookingRequests.js'
import { parseId, parsePagination } from '../validation/parsers.js'

export interface BookingsRoutesDeps {
  bookingsService: Pick<BookingsService, 'create' | 'cancel' | 'findForUser' | 'findAll'>
  requireAuth: RequestHandler
}

export const createBookingsRoutes = ({ bookingsService, requireAuth }: BookingsRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.get('/me', async (req, res) => {
    res.json(await bookingsService.findForUser(currentUser(req).id, parsePagination(req.query)))
  })

  router.get('/', requireRole('ADMIN'), async (req, res) => {
    res.json(
      await bookingsService.findAll(
        parseAdminBookingFilters(req.query),
        parsePagination(req.query),
      ),
    )
  })

  router.post('/', async (req, res) => {
    const booking = await bookingsService.create(currentUser(req).id, parseNewBooking(req.body))
    res.status(201).json(booking)
  })

  router.post('/:id/cancel', async (req, res) => {
    const user = currentUser(req)
    await bookingsService.cancel(user.id, parseId(req.params.id, 'id'), user.role === 'ADMIN')
    res.sendStatus(204)
  })

  return router
}
