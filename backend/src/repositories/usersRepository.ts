import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { UserRole } from '@contracts/user.js'

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

type ExecuteValues = NonNullable<Parameters<Pool['execute']>[1]>

type QueryParams = Record<string, ExecuteValues>

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

  const findOneBy = async (
    column: 'id' | 'google_id' | 'email',
    value: string | number,
  ): Promise<User | undefined> => {
    const [user] = await selectUsers(`WHERE ${column} = :value`, { value })
    return user
  }

  const updateOne = async (id: number, assignment: string, params: QueryParams = {}) => {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE users SET ${assignment} WHERE id = :id`,
      { ...params, id },
    )
    return result.affectedRows === 1
  }

  return {
    findAll: () => selectUsers('ORDER BY name'),
    findById: (id: number) => findOneBy('id', id),
    findByGoogleId: (googleId: string) => findOneBy('google_id', googleId),
    findByEmail: (email: string) => findOneBy('email', email),
    create: async (user: NewUser) => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO users (google_id, name, email, avatar_path, role)
         VALUES (:googleId, :name, :email, :avatarPath, :role)`,
        user,
      )
      return result.insertId
    },
    updateRole: (id: number, role: UserRole) => updateOne(id, 'role = :role', { role }),
    recordLogin: (id: number) => updateOne(id, 'last_login_at = CURRENT_TIMESTAMP'),
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
