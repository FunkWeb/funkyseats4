import type { UserDto } from '../../../contracts/user.js'
import type { NewUser, UsersRepository } from '../repositories/usersRepository.js'

export type GoogleProfile = Omit<NewUser, 'role'>

export interface AuthServiceDeps {
  users: Pick<UsersRepository, 'findById' | 'findByGoogleId' | 'create' | 'recordLogin'>
  fetchGoogleProfile: (code: string) => Promise<GoogleProfile>
}

export const createAuthService = (_deps: AuthServiceDeps) => {
  const loginWithGoogle = async (_code: string): Promise<UserDto> => {
    throw new Error('Not implemented')
  }

  return { loginWithGoogle }
}

export type AuthService = ReturnType<typeof createAuthService>
