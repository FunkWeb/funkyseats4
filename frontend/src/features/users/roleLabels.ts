import { USER_ROLES, type UserRole } from '../../../../contracts/user'

export const ROLE_LABELS: Record<UserRole, string> = {
  CANDIDATE: 'Kandidat',
  SUPERVISOR: 'Veileder',
  ADMIN: 'Administrator',
}

export const ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))
