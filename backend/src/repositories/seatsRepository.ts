import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { Seat, CreateSeatInput, UpdateSeatInput } from '../../contracts/seat.js'
import type { QueryParams } from '../database/queryParams.js'

type SeatRow = Seat & RowDataPacket
type SeatField = keyof UpdateSeatInput

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

const COLUMNS = {
  roomId: 'room_id',
  seatNumber: 'seat_number',
  description: 'description',
} as const satisfies Record<SeatField, string>

export const seatsRepository = (db: Pool) => {
  const selectSeats = async (clause: string, params: QueryParams = {}): Promise<Seat[]> => {
    const [rows] = await db.execute<SeatRow[]>(`${SELECT_SEAT} ${clause}`, params)
    return rows
  }

  const updateOne = async (id: number, assignment: string, params: QueryParams) => {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE seats SET ${assignment} WHERE id = :id`,
      { ...params, id },
    )
    return result.affectedRows === 1
  }

  return {
    findAll: () => selectSeats('ORDER BY room_id, seat_number'),
    findById: async (id: number): Promise<Seat | undefined> => {
      const [seat] = await selectSeats('WHERE id = :id', { id })
      return seat
    },
    findByRoomId: (roomId: number) =>
      selectSeats('WHERE room_id = :roomId ORDER BY seat_number', { roomId }),

    create: async (seat: CreateSeatInput): Promise<number> => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO seats (room_id, seat_number, description)
         VALUES (:roomId, :seatNumber, :description)`,
        seat,
      )
      return result.insertId
    },

    update: async (id: number, input: UpdateSeatInput): Promise<boolean> => {
      const fields = (Object.keys(COLUMNS) as SeatField[]).filter(
        (field) => input[field] !== undefined,
      )
      if (fields.length === 0) return false

      const assignment = fields.map((field) => `${COLUMNS[field]} = :${field}`).join(', ')
      const params = Object.fromEntries(fields.map((field) => [field, input[field]])) as QueryParams
      return updateOne(id, assignment, params)
    },

    delete: async (id: number): Promise<boolean> => {
      const [result] = await db.execute<ResultSetHeader>('DELETE FROM seats WHERE id = :id', { id })
      return result.affectedRows === 1
    },
  }
}

export type SeatsRepository = ReturnType<typeof seatsRepository>
