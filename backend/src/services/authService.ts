import type { UserDto } from '../../../contracts/user.js'
import type { UsersRepository } from '../repositories/usersRepository.js'
import type { GoogleProfile } from '../auth/googleOAuth.js'
import { toUserDto } from './usersService.js'

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

export type AuthService = ReturnType<typeof createAuthService>
