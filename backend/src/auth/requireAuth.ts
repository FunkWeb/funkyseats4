import type { RequestHandler } from 'express'
import { UnauthorizedError } from '../errors/appErrors.js'
import type { UsersRepository } from '../repositories/usersRepository.js'
import { toUserDto } from '../services/usersService.js'
import type { Session } from './session.js'

interface RequireAuthDeps {
  session: Pick<Session, 'readUserId'>
  users: Pick<UsersRepository, 'findById'>
}

export const createRequireAuth =
  ({ session, users }: RequireAuthDeps): RequestHandler =>
  async (req, _res, next) => {
    const userId = session.readUserId(req)
    const user = userId === null ? null : await users.findById(userId)
    if (!user) return next(new UnauthorizedError())

    req.user = toUserDto(user)
    next()
  }
