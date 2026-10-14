import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { RoomDto } from '../../../contracts/rooms.js'

export type Room = RoomDto

type RoomRow = Omit<Room, 'updatedAt' | 'createdAt'> &
  RowDataPacket & {
    updatedAt: Date | string
    createdAt: Date | string
  }

export type NewRoom = Pick<Room, 'slug' | 'name'> &
  Partial<Pick<Room, 'description' | 'seatMapPath' | 'maxDaysAhead'>>

type ExecuteValues = NonNullable<Parameters<Pool['execute']>[1]>
type QueryParams = Record<string, ExecuteValues>

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

const toTimestamp = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString()

const toRoomDto = (row: RoomRow): Room => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  seatMapPath: row.seatMapPath,
  maxDaysAhead: row.maxDaysAhead,
  updatedAt: toTimestamp(row.updatedAt),
  createdAt: toTimestamp(row.createdAt),
})

export const createRoomsRepository = (db: Pool) => {
  const getById = async (id: number): Promise<Room | null> => {
    const [rows] = await db.execute<RoomRow[]>(
      `SELECT ${roomColumns} FROM rooms WHERE id = ? AND deleted_at IS NULL`,
      [id],
    )
    return rows[0] ? toRoomDto(rows[0]) : null
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

  const getAll = async (): Promise<Room[]> => {
    const [rows] = await db.execute<RoomRow[]>(
      `SELECT ${roomColumns} FROM rooms WHERE deleted_at IS NULL ORDER BY name`,
    )
    return rows.map(toRoomDto)
  }

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

  return { create, getById, getAll, update, delete: deleteRoom }
}

export type RoomsRepository = ReturnType<typeof createRoomsRepository>
