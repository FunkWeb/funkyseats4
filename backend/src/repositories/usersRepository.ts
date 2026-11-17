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
  sessionVersion: number
  lastLoginAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export type NewUser = Pick<User, 'googleId' | 'name' | 'email' | 'avatarPath' | 'role'>

type UserRow = User & RowDataPacket
type CountRow = { total: number } & RowDataPacket

const SELECT_USER = `
  SELECT
    id,
    google_id       AS googleId,
    name,
    email,
    avatar_path     AS avatarPath,
    role,
    session_version AS sessionVersion,
    last_login_at   AS lastLoginAt,
    updated_at      AS updatedAt,
    created_at      AS createdAt
  FROM users`

export const createUsersRepository = (db: Pool) => {
  const selectUsers = async (clause: string, params: QueryParams = {}): Promise<User[]> => {
    const [rows] = await db.execute<UserRow[]>(`${SELECT_USER} ${clause}`, params)
    return rows
  }

  const findById = async (id: number): Promise<User | null> => {
    const [user] = await selectUsers('WHERE id = :id', { id })
    return user ?? null
  }

  return {
    findAll: async (page: number, pageSize: number): Promise<{ items: User[]; total: number }> => {
      const offset = (page - 1) * pageSize
      const [items, [countRows]] = await Promise.all([
        selectUsers('ORDER BY name, id LIMIT :limit OFFSET :offset', {
          limit: pageSize,
          offset,
        }),
        db.execute<CountRow[]>('SELECT COUNT(*) AS total FROM users'),
      ])
      return {
        items,
        total: Number(countRows[0]?.total ?? 0),
      }
    },
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
    revokeSessions: async (id: number, sessionVersion: number) => {
      const [result] = await db.execute<ResultSetHeader>(
        `UPDATE users SET session_version = session_version + 1
         WHERE id = :id AND session_version = :sessionVersion`,
        { id, sessionVersion },
      )
      return result.affectedRows === 1
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
