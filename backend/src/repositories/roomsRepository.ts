import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { CreateRoomRequest, RoomDto, UpdateRoomRequest } from '../../../contracts/rooms.js'

export type RoomInput = CreateRoomRequest
export type Room = RoomDto

interface RoomRow extends RowDataPacket {
  id: number
  slug: string
  name: string
  description: string | null
  seatMapPath: string | null
  maxDaysAhead: number
  updatedAt: Date | string
  createdAt: Date | string
}

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

const updateColumns = {
  slug: 'slug',
  name: 'name',
  description: 'description',
  seatMapPath: 'seat_map_path',
  maxDaysAhead: 'max_days_ahead',
} satisfies Record<keyof CreateRoomRequest, string>

const isRoomInputKey = (key: string): key is keyof CreateRoomRequest =>
  Object.hasOwn(updateColumns, key)

const toTimestamp = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString()

const toRoomDto = (row: RoomRow): RoomDto => ({
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
  const getById = async (id: number): Promise<RoomDto | null> => {
    const [rows] = await db.execute<RoomRow[]>(
      `SELECT ${roomColumns} FROM rooms WHERE id = ? AND deleted_at IS NULL`,
      [id],
    )
    return rows[0] ? toRoomDto(rows[0]) : null
  }

  const create = async (room: CreateRoomRequest): Promise<number> => {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO rooms (slug, name, description, seat_map_path, max_days_ahead)
       VALUES (?, ?, ?, ?, ?)`,
      [
        room.slug,
        room.name,
        room.description ?? null,
        room.seatMapPath ?? null,
        room.maxDaysAhead ?? 7,
      ],
    )
    return result.insertId
  }

  const getAll = async (): Promise<RoomDto[]> => {
    const [rows] = await db.execute<RoomRow[]>(
      `SELECT ${roomColumns} FROM rooms WHERE deleted_at IS NULL`,
    )
    return rows.map(toRoomDto)
  }

  const update = async (id: number, data: UpdateRoomRequest): Promise<boolean> => {
    const fields: string[] = []
    const values: (string | number | null)[] = []

    for (const [key, value] of Object.entries(data)) {
      if (!isRoomInputKey(key)) continue
      fields.push(`${updateColumns[key]} = ?`)
      values.push(value ?? null)
    }

    if (fields.length === 0) return false

    values.push(id)
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE rooms SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values,
    )
    return result.affectedRows > 0
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
