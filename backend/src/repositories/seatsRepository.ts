import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { CreateSeatRequest, SeatDto, UpdateSeatRequest } from '../../../contracts/seat.js'
import { pickColumns } from '../database/columns.js'
import type { QueryParams } from '../database/queryParams.js'

type SeatRow = SeatDto & RowDataPacket

const SELECT_SEAT = `
  SELECT
    id,
    room_id         AS roomId,
    seat_number     AS seatNumber,
    description,
    deleted_at      AS deletedAt,
    updated_at      AS updatedAt,
    created_at      AS createdAt
  FROM seats`

const WRITABLE_FIELDS = ['roomId', 'seatNumber', 'description'] as const

export const createSeatsRepository = (db: Pool) => {
  const selectSeats = async (clause: string, params: QueryParams = {}): Promise<SeatDto[]> => {
    const [rows] = await db.execute<SeatRow[]>(
      `${SELECT_SEAT} WHERE deleted_at IS NULL ${clause}`,
      params,
    )
    return rows
  }

  const updateOne = async (id: number, assignment: string, params: QueryParams = {}) => {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE seats SET ${assignment} WHERE id = :id AND deleted_at IS NULL`,
      { ...params, id },
    )
    return result.affectedRows === 1
  }

  return {
    findAll: () => selectSeats('ORDER BY room_id, seat_number'),
    findById: async (id: number): Promise<SeatDto | null> => {
      const [seat] = await selectSeats('AND id = :id', { id })
      return seat ?? null
    },
    findByRoomId: (roomId: number) =>
      selectSeats('AND room_id = :roomId ORDER BY seat_number', { roomId }),

    create: async (seat: CreateSeatRequest): Promise<number> => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO seats (room_id, seat_number, description)
         VALUES (:roomId, :seatNumber, :description)`,
        seat,
      )
      return result.insertId
    },

    update: async (id: number, input: UpdateSeatRequest): Promise<boolean> => {
      const { assignments, params } = pickColumns(WRITABLE_FIELDS, input)
      if (assignments.length === 0) return false
      return updateOne(id, assignments.join(', '), params)
    },

    delete: (id: number): Promise<boolean> => updateOne(id, 'deleted_at = CURRENT_TIMESTAMP'),
  }
}

export type SeatsRepository = ReturnType<typeof createSeatsRepository>
