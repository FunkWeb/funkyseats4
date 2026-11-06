export const USER_ROLES = ['CANDIDATE', 'SUPERVISOR', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

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
