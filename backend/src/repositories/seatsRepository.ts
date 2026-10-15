import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { Seat, CreateSeatInput, UpdateSeatInput } from '../../contracts/seat.js'
import type { QueryParams } from '../database/queryParams.js'

type SeatRow = Seat & RowDataPacket

const SELECT_SEAT = `
  SELECT
    id,
    room_id         AS roomId,
    label,
    x,
    y,
    status,
    type,
    updated_at      AS updatedAt,
    created_at      AS createdAt
  FROM seats`

export const seatsRepository = (db: Pool) => {
  const selectSeats = async (clause: string = '', params: QueryParams = {}): Promise<Seat[]> => {
    const [rows] = await db.execute<SeatRow[]>(`${SELECT_SEAT} ${clause}`, params)
    return rows
  }

  const findOneBy = async (
    column: 'id' | 'room_id' | 'label',
    value: string | number,
  ): Promise<Seat | undefined> => {
    const [seat] = await selectSeats(`WHERE ${column} = :value`, { value })
    return seat
  }

  const updateOne = async (id: number, assignment: string, params: QueryParams = {}) => {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE seats SET ${assignment} WHERE id = :id`,
      { ...params, id },
    )
    return result.affectedRows === 1
  }

  return {
    findAll: () => selectSeats('ORDER BY room_id'),
    findById: (id: number) => findOneBy('id', id),
    findByRoomId: (roomId: number) =>
      selectSeats('WHERE room_id = :roomId ORDER BY label', { roomId }),

    create: async (seat: CreateSeatInput): Promise<number> => {
      const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO seats (room_id, label, x, y, status, type)
         VALUES (:roomId, :label, :x, :y, :status, :type)`,
        seat as unknown as QueryParams,
      )
      return result.insertId
    },

    update: async (id: number, input: UpdateSeatInput): Promise<boolean> => {
      const updates: string[] = []
      const params: QueryParams = { id }

      const updateOne = async (id: number, assignment: string, params: QueryParams = {}) => {
        const [result] = await db.execute<ResultSetHeader>(
          `UPDATE users SET ${assignment} WHERE id = :id`,
          { ...params, id },
        )
        return result.affectedRows === 1
      }

      if (updates.length === 0) return false

      return updateOne(id, updates.join(', '), params)
    },

    delete: async (id: number): Promise<boolean> => {
      const [result] = await db.execute<ResultSetHeader>('DELETE FROM seats WHERE id = :id', { id })
      return result.affectedRows === 1
    },
  }
}

export type SeatsRepository = ReturnType<typeof seatsRepository>
