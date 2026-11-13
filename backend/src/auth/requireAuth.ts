import type { Request, RequestHandler } from 'express'
import { UnauthorizedError } from '../errors/appErrors.js'
import type { UsersRepository } from '../repositories/usersRepository.js'
import { toUserDto } from '../services/usersService.js'
import type { Session } from './session.js'

interface RequireAuthDeps {
  session: Pick<Session, 'readIdentity'>
  users: Pick<UsersRepository, 'findById'>
}

export const createRequireAuth =
  ({ session, users }: RequireAuthDeps): RequestHandler =>
  async (req, _res, next) => {
    const identity = session.readIdentity(req)
    const user = identity === null ? null : await users.findById(identity.userId)
    if (!user || user.sessionVersion !== identity?.sessionVersion)
      return next(new UnauthorizedError())

    req.user = toUserDto(user)
    next()
  }

export const currentUser = (req: Request) => {
  if (!req.user) throw new UnauthorizedError()
  return req.user
}
