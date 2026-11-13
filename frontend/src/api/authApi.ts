import type { UserDto } from '../../../contracts/user'
import { get, post, UnauthorizedError } from './httpClient'

export const googleLoginUrl = '/api/auth/google'

export function getMe(): Promise<UserDto | null> {
  return get<UserDto>('/auth/me').catch((error: unknown) => {
    if (error instanceof UnauthorizedError) return null
    throw error
  })
}

export function logout(): Promise<void> {
  return post<void>('/auth/logout')
}
