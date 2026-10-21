import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { CreateRoomRequest, UpdateRoomRequest } from '../../../contracts/room.js'
import { pickColumns } from '../database/columns.js'
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

const SELECT_ROOM = `
  SELECT
    id,
    slug,
    name,
    description,
    seat_map_path   AS seatMapPath,
    max_days_ahead  AS maxDaysAhead,
    updated_at      AS updatedAt,
    created_at      AS createdAt
  FROM rooms`

const WRITABLE_FIELDS = ['slug', 'name', 'description', 'seatMapPath', 'maxDaysAhead'] as const

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
      `${SELECT_ROOM} WHERE deleted_at IS NULL ${clause}`,
      params,
    )
    return rows.map(toRoom)
  }

  const updateOne = async (id: number, assignment: string, params: QueryParams = {}) => {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE rooms SET ${assignment} WHERE id = :id AND deleted_at IS NULL`,
      { ...params, id },
    )
    return result.affectedRows === 1
  }

  const findById = async (id: number): Promise<Room | null> => {
    const [room] = await selectActiveRooms('AND id = :id', { id })
    return room ?? null
  }

  const create = async (room: CreateRoomRequest): Promise<number> => {
    const { columns, placeholders, params } = pickColumns(WRITABLE_FIELDS, room)
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO rooms (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      params,
    )
    return result.insertId
  }

  const update = async (id: number, input: UpdateRoomRequest): Promise<boolean> => {
    const { assignments, params } = pickColumns(WRITABLE_FIELDS, input)
    if (assignments.length === 0) return false
    return updateOne(id, assignments.join(', '), params)
  }

  return {
    create,
    findById,
    findAll: () => selectActiveRooms('ORDER BY name'),
    update,
    delete: (id: number): Promise<boolean> => updateOne(id, 'deleted_at = CURRENT_TIMESTAMP'),
  }
}

export type RoomsRepository = ReturnType<typeof createRoomsRepository>
