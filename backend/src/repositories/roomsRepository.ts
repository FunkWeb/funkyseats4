import type {
  FieldPacket,
  QueryResult,
  QueryValues,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise'

export interface RoomInput {
  slug: string
  name: string
  description?: string | null
  seat_map_path?: string | null
  max_days_ahead?: number
}

export interface Room {
  id: number
  slug: string
  name: string
  description: string | null
  seat_map_path: string | null
  max_days_ahead: number
  deleted_at: Date | null
  updated_at: Date
  created_at: Date
}

type RoomRow = Room & RowDataPacket

export interface RoomQueryExecutor {
  query<T extends QueryResult>(sql: string, values?: QueryValues): Promise<[T, FieldPacket[]]>
}

const updateColumns = {
  slug: 'slug',
  name: 'name',
  description: 'description',
  seat_map_path: 'seat_map_path',
  max_days_ahead: 'max_days_ahead',
} satisfies Record<keyof RoomInput, string>

const isRoomInputKey = (key: string): key is keyof RoomInput => Object.hasOwn(updateColumns, key)

export class RoomRepository {
  constructor(private readonly db: RoomQueryExecutor) {}

  async create(room: RoomInput): Promise<number> {
    const [result] = await this.db.query<ResultSetHeader>(
      `INSERT INTO rooms (slug, name, description, seat_map_path, max_days_ahead)
       VALUES (?, ?, ?, ?, ?)`,
      [
        room.slug,
        room.name,
        room.description ?? null,
        room.seat_map_path ?? null,
        room.max_days_ahead ?? 7,
      ],
    )

    return result.insertId
  }

  async getById(id: number): Promise<Room | null> {
    const [rows] = await this.db.query<RoomRow[]>(
      'SELECT * FROM rooms WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    return rows[0] ?? null
  }

  async getAll(): Promise<Room[]> {
    const [rows] = await this.db.query<RoomRow[]>('SELECT * FROM rooms WHERE deleted_at IS NULL')
    return rows
  }

  async update(id: number, data: Partial<RoomInput>): Promise<boolean> {
    const fields: string[] = []
    const values: (string | number | null)[] = []

    for (const [key, value] of Object.entries(data)) {
      if (!isRoomInputKey(key)) continue
      fields.push(`${updateColumns[key]} = ?`)
      values.push(value ?? null)
    }

    if (fields.length === 0) return false

    values.push(id)
    const [result] = await this.db.query<ResultSetHeader>(
      `UPDATE rooms SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values,
    )
    return result.affectedRows > 0
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await this.db.query<ResultSetHeader>(
      'UPDATE rooms SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    return result.affectedRows > 0
  }
}
