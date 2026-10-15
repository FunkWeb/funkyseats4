import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { QueryParams } from '../database/queryParams.js'

type Room = {
  id: number
  slug: string
  name: string
  description: string | null
  seatMapPath: string | null
  maxDaysAhead: number
  deletedAt: Date | null
  updatedAt: Date
  createdAt: Date
}

type RoomRow = Omit<Room, 'deletedAt' | 'updatedAt' | 'createdAt'> &
  RowDataPacket & {
    updatedAt: Date | string
    createdAt: Date | string
  }

export type NewRoom = Pick<Room, 'slug' | 'name'> &
  Partial<Pick<Room, 'description' | 'seatMapPath' | 'maxDaysAhead'>>

const roomColumns = `
  id,
  slug,
  name,
  description,
  seat_map_path AS seatMapPath,
  max_days_ahead AS maxDaysAhead,
  updated_at AS updatedAt,
  created_at AS createdAt
`

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value))

const toRoom = (row: RoomRow): Room => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  seatMapPath: row.seatMapPath,
  maxDaysAhead: row.maxDaysAhead,
  deletedAt: null,
  updatedAt: toDate(row.updatedAt),
  createdAt: toDate(row.createdAt),
})

export const createRoomsRepository = (db: Pool) => {
  const selectActiveRooms = async (clause: string, params: QueryParams = {}): Promise<Room[]> => {
    const [rows] = await db.execute<RoomRow[]>(
      `SELECT ${roomColumns} FROM rooms WHERE deleted_at IS NULL ${clause}`,
      params,
    )
    return rows.map(toRoom)
  }

  const findById = async (id: number): Promise<Room | null> => {
    const [room] = await selectActiveRooms('AND id = :id', { id })
    return room ?? null
  }

  const create = async (room: NewRoom): Promise<number> => {
    const hasMaxDaysAhead = room.maxDaysAhead !== undefined
    const values: (string | number | null)[] = [
      room.slug,
      room.name,
      room.description ?? null,
      room.seatMapPath ?? null,
    ]
    if (room.maxDaysAhead !== undefined) values.push(room.maxDaysAhead)

    const [result] = await db.execute<ResultSetHeader>(
      hasMaxDaysAhead
        ? `INSERT INTO rooms (slug, name, description, seat_map_path, max_days_ahead)
       VALUES (?, ?, ?, ?, ?)`
        : `INSERT INTO rooms (slug, name, description, seat_map_path)
       VALUES (?, ?, ?, ?)`,
      values,
    )
    return result.insertId
  }

  const findAll = () => selectActiveRooms('ORDER BY name')

  const update = async (id: number, assignment: string, params: QueryParams = {}) => {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE rooms SET ${assignment} WHERE id = :id AND deleted_at IS NULL`,
      { ...params, id },
    )
    return result.affectedRows === 1
  }

  const deleteRoom = async (id: number): Promise<boolean> => {
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE rooms SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    return result.affectedRows > 0
  }

  return { create, findById, findAll, update, delete: deleteRoom }
}

export type RoomsRepository = ReturnType<typeof createRoomsRepository>
