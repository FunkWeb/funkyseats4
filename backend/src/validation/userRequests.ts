import { USER_ROLES, type UpdateUserRoleRequest } from '../../../contracts/user.js'
import { asRecord, parseOneOf } from './parsers.js'

export const parseUpdateUserRole = (body: unknown): UpdateUserRoleRequest => ({
  role: parseOneOf(USER_ROLES, asRecord(body).role, 'role'),
})
