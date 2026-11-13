import type { UsersRepository } from '../repositories/usersRepository.js'
import type { GoogleProfile } from '../auth/googleOAuth.js'
import type { SessionIdentity } from '../auth/session.js'

export interface AuthServiceDeps {
  users: Pick<UsersRepository, 'upsertGoogleLogin' | 'revokeSessions'>
  fetchGoogleProfile: (code: string) => Promise<GoogleProfile>
}

export const createAuthService = ({ users, fetchGoogleProfile }: AuthServiceDeps) => {
  const loginWithGoogle = async (code: string): Promise<SessionIdentity> => {
    const profile = await fetchGoogleProfile(code)
    const user = await users.upsertGoogleLogin({ ...profile, role: 'CANDIDATE' })
    return { userId: user.id, sessionVersion: user.sessionVersion }
  }

  const logout = async ({ userId, sessionVersion }: SessionIdentity): Promise<void> => {
    await users.revokeSessions(userId, sessionVersion)
  }

  return { loginWithGoogle, logout }
}

export type AuthService = ReturnType<typeof createAuthService>
