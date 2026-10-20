import type { UserDto } from '../../../contracts/user.js'
import type { NewUser, User, UsersRepository } from '../repositories/usersRepository.js'

export type GoogleProfile = Omit<NewUser, 'role'>

export interface AuthServiceDeps {
  users: Pick<UsersRepository, 'findById' | 'findByGoogleId' | 'create' | 'recordLogin'>
  fetchGoogleProfile: (code: string) => Promise<GoogleProfile>
}

export const createAuthService = ({ users, fetchGoogleProfile }: AuthServiceDeps) => {
  const loginWithGoogle = async (code: string): Promise<UserDto> => {
    const profile = await fetchGoogleProfile(code)
    const existingUser = await users.findByGoogleId(profile.googleId)
    let userId = existingUser?.id

    if (userId === undefined) {
      userId = await users.create({
        ...profile,
        role: 'CANDIDATE',
      })
    }

    if (!(await users.recordLogin(userId))) {
      throw new Error('Failed to record user login')
    }

    const user = await users.findById(userId)
    if (!user) throw new Error('User not found after login')

    return toUserDto(user)
  }

  return { loginWithGoogle }
}

const toUserDto = (user: User): UserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarPath: user.avatarPath,
  role: user.role,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  updatedAt: user.updatedAt.toISOString(),
  createdAt: user.createdAt.toISOString(),
})

export type AuthService = ReturnType<typeof createAuthService>
