import type { UserDto } from '../../../contracts/user.js'

declare global {
  namespace Express {
    interface Request {
      user?: UserDto
    }
  }
}
