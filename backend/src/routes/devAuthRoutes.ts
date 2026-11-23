import { Router, type RequestHandler } from 'express'
import { USER_ROLES, type UserRole } from '../../../contracts/user.js'
import type { Session } from '../auth/session.js'
import type { UsersRepository } from '../repositories/usersRepository.js'
import { ForbiddenError, ValidationError } from '../errors/appErrors.js'

interface DevAuthRoutesDeps {
  users: Pick<UsersRepository, 'upsertGoogleLogin'>
  session: Pick<Session, 'setSessionCookie'>
}

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const requireLocalhost: RequestHandler = (req, _res, next) => {
  if (LOOPBACK_ADDRESSES.has(req.socket.remoteAddress ?? '')) return next()
  next(new ForbiddenError('Dev login is only available from localhost'))
}

const isUserRole = (value: unknown): value is UserRole => USER_ROLES.includes(value as UserRole)

export const createDevAuthRoutes = ({ users, session }: DevAuthRoutesDeps) => {
  const router = Router()

  router.use('/dev-login', requireLocalhost)

  router.get('/dev-login', (_req, res) => {
    res.sendStatus(204)
  })

  router.post('/dev-login', async (req, res) => {
    const role: unknown = (req.body as { role?: unknown } | undefined)?.role
    if (!isUserRole(role)) throw new ValidationError(`role must be one of ${USER_ROLES.join(', ')}`)

    const slug = role.toLowerCase()
    const user = await users.upsertGoogleLogin({
      googleId: `dev-${slug}`,
      name: `Dev ${role.charAt(0)}${slug.slice(1)}`,
      email: `${slug}@dev.local`,
      avatarPath: null,
      role,
    })

    session.setSessionCookie(res, { userId: user.id, sessionVersion: user.sessionVersion })
    res.sendStatus(204)
  })

  return router
}
