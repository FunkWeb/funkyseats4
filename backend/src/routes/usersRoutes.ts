import { Router, RequestHandler } from 'express'
import type { UsersService } from '../services/usersService.js'
import { NotFoundError } from '../errors/appErrors.js'

type UserRole = 'CANDIDATE' | 'SUPERVISOR' | 'ADMIN'
const VALID_ROLES: UserRole[] = ['CANDIDATE', 'SUPERVISOR', 'ADMIN']

export const createUsersRoutes = (
  usersService: UsersService,
  requireAuth: RequestHandler,
  requireRole: (...allowed: UserRole[]) => RequestHandler,
) => {
  const router = Router()

  router.use(requireAuth)
  router.use(requireRole('ADMIN'))

  router.get('/', async (req, res, next) => {
    try {
      const users = await usersService.findAll()
      return res.json(users)
    } catch (error) {
      next(error)
    }
  })

  router.patch('/:id/role', async (req, res, next) => {
    try {
      const userId = Number(req.params.id)
      const { role } = req.body

      if (!role || !VALID_ROLES.includes(role as UserRole)) {
        return res.status(400).send()
      }

      await usersService.updateRole(userId, { role: role as UserRole })
      return res.status(204).send()
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).send()
      }
      next(error)
    }
  })

  return router
}
