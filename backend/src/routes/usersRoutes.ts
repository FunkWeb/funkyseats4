import { Router, type RequestHandler } from 'express'
import { requireRole } from '../auth/requireRole.js'
import type { UsersService } from '../services/usersService.js'
import { parseId, parsePagination } from '../validation/parsers.js'
import { parseUpdateUserRole } from '../validation/userRequests.js'

export interface UsersRoutesDeps {
  usersService: Pick<UsersService, 'findAll' | 'updateRole'>
  requireAuth: RequestHandler
}

export const createUsersRoutes = ({ usersService, requireAuth }: UsersRoutesDeps) => {
  const router = Router()
  router.use(requireAuth, requireRole('ADMIN'))

  router.get('/', async (req, res) => {
    const { page, pageSize } = parsePagination(req.query)
    res.json(await usersService.findAll(page, pageSize))
  })

  router.patch('/:id/role', async (req, res) => {
    await usersService.updateRole(parseId(req.params.id, 'id'), parseUpdateUserRole(req.body))
    res.sendStatus(204)
  })

  return router
}
