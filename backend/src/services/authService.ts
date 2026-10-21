import type { UserDto } from '../../../contracts/user.js'
import type { User, UsersRepository } from '../repositories/usersRepository.js'
import type { GoogleProfile } from '../auth/googleOAuth.js'

export interface AuthServiceDeps {
  users: Pick<UsersRepository, 'upsertGoogleLogin'>
  fetchGoogleProfile: (code: string) => Promise<GoogleProfile>
}

export const createAuthService = ({ users, fetchGoogleProfile }: AuthServiceDeps) => {
  const loginWithGoogle = async (code: string): Promise<UserDto> => {
    const profile = await fetchGoogleProfile(code)
    return toUserDto(await users.upsertGoogleLogin({ ...profile, role: 'CANDIDATE' }))
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
