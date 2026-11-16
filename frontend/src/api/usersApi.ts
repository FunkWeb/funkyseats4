import type { UpdateUserRoleRequest, UserDto } from '../../../contracts/user'
import { get, patch } from './httpClient'

export function getUsers(): Promise<UserDto[]> {
  return get<UserDto[]>('/users')
}

export function updateUserRole(id: number, input: UpdateUserRoleRequest): Promise<void> {
  return patch<void>(`/users/${id}/role`, input)
}
