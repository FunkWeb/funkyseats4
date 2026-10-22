import type { UpdateUserRoleRequest, UserDto } from '../../../contracts/user.js'
import { NotFoundError } from '../errors/appErrors.js'
import type { User, UsersRepository } from '../repositories/usersRepository.js'
import { findOrThrow } from './common.js'

export interface UsersServiceDeps {
  users: Pick<UsersRepository, 'findAll' | 'findById' | 'updateRole'>
}

export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarPath: user.avatarPath,
  role: user.role,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  updatedAt: user.updatedAt.toISOString(),
  createdAt: user.createdAt.toISOString(),
})

export const createUsersService = ({ users }: UsersServiceDeps) => {
  const findAll = async (): Promise<UserDto[]> => (await users.findAll()).map(toUserDto)

  const findById = async (userId: number): Promise<UserDto> =>
    toUserDto(await findOrThrow(users.findById(userId), 'User'))

  const updateRole = async (userId: number, { role }: UpdateUserRoleRequest): Promise<void> => {
    if (!(await users.updateRole(userId, role))) throw new NotFoundError('User')
  }

  return { findAll, findById, updateRole }
}

export type UsersService = ReturnType<typeof createUsersService>
