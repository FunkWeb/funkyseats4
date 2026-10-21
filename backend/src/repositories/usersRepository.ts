import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { UserRole } from '../../../contracts/user.js'
import type { QueryParams } from '../database/queryParams.js'

export interface User {
  id: number
  googleId: string
  name: string
  email: string
  avatarPath: string | null
  role: UserRole
  lastLoginAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export type NewUser = Pick<User, 'googleId' | 'name' | 'email' | 'avatarPath' | 'role'>

type UserRow = User & RowDataPacket

const SELECT_USER = `
  SELECT
    id,
    google_id     AS googleId,
    name,
    email,
    avatar_path   AS avatarPath,
    role,
    last_login_at AS lastLoginAt,
    updated_at    AS updatedAt,
    created_at    AS createdAt
  FROM users`

export const createUsersRepository = (db: Pool) => {
  const selectUsers = async (clause: string, params: QueryParams = {}): Promise<User[]> => {
    const [rows] = await db.execute<UserRow[]>(`${SELECT_USER} ${clause}`, params)
    return rows
  }

  const findById = async (id: number): Promise<User | undefined> => {
    const [user] = await selectUsers('WHERE id = :id', { id })
    return user
  }

  return {
    findAll: () => selectUsers('ORDER BY name'),
    findById,
    create: async (user: NewUser) => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO users (google_id, name, email, avatar_path, role)
         VALUES (:googleId, :name, :email, :avatarPath, :role)`,
        user,
      )
      return result.insertId
    },
    upsertGoogleLogin: async (user: NewUser) => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO users (google_id, name, email, avatar_path, role, last_login_at)
         VALUES (:googleId, :name, :email, :avatarPath, :role, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE last_login_at = CURRENT_TIMESTAMP, id = LAST_INSERT_ID(id)`,
        user,
      )
      const upserted = await findById(result.insertId)
      if (upserted?.googleId !== user.googleId) {
        throw new Error(`Google login for ${user.email} collided with user ${result.insertId}`)
      }
      return upserted
    },
    updateRole: async (id: number, role: UserRole) => {
      const [result] = await db.execute<ResultSetHeader>(
        'UPDATE users SET role = :role WHERE id = :id',
        { role, id },
      )
      return result.affectedRows === 1
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
