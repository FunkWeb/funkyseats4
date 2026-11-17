import { Router, type RequestHandler } from 'express'
import { requireRole } from '../auth/requireRole.js'
import { ValidationError } from '../errors/appErrors.js'
import type { UsersService } from '../services/usersService.js'
import { parseId, parsePositiveInteger } from '../validation/parsers.js'
import { parseUpdateUserRole } from '../validation/userRequests.js'

export interface UsersRoutesDeps {
  usersService: Pick<UsersService, 'findAll' | 'updateRole'>
  requireAuth: RequestHandler
}

export const createUsersRoutes = ({ usersService, requireAuth }: UsersRoutesDeps) => {
  const router = Router()
  router.use(requireAuth, requireRole('ADMIN'))

  router.get('/', async (req, res) => {
    const page = req.query.page !== undefined ? parsePositiveInteger(req.query.page, 'page') : 1
    const pageSize =
      req.query.pageSize !== undefined ? parsePositiveInteger(req.query.pageSize, 'pageSize') : 20

    if (pageSize > 100) {
      throw new ValidationError('pageSize must be at most 100')
    }

    res.json(await usersService.findAll(page, pageSize))
  })

  router.patch('/:id/role', async (req, res) => {
    await usersService.updateRole(parseId(req.params.id, 'id'), parseUpdateUserRole(req.body))
    res.sendStatus(204)
  })

  return router
}
