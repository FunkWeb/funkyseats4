export type UserRole = 'CANDIDATE' | 'SUPERVISOR' | 'ADMIN'

export interface UserDto {
  id: number
  name: string
  email: string
  avatarPath: string | null
  role: UserRole
  lastLoginAt: string | null
  updatedAt: string
  createdAt: string
}

export interface UpdateUserRoleRequest {
  role: UserRole
}
