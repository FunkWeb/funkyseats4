import type { Seat, CreateSeatInput, UpdateSeatInput } from '../../contracts/seat.js'
import { pool } from '../database/connectionPool.js'

export const seatsRepository = {
  async create(seat: CreateSeatInput): Promise<Seat> {
    const [result] = await pool.query(
      'INSERT INTO seats (room_id, seat_number, description) VALUES (?, ?, ?)',
      [seat.room_id, seat.seat_number, seat.description ?? null],
    )

    const insertId = (result as any).insertId
    const createdSeat = await this.findById(insertId)
    if (!createdSeat) {
      throw new Error('Failed to retrieve created seat')
    }
    return createdSeat
  },

  async findById(id: number): Promise<Seat | null> {
    const [rows] = await pool.query('SELECT * FROM seats WHERE id = ? AND deleted_at IS NULL', [id])
    const seats = rows as Seat[]
    return seats.length > 0 ? seats[0] : null
  },

  async findByRoomId(room_id: number): Promise<Seat[]> {
    const [rows] = await pool.query(
      'SELECT * FROM seats WHERE room_id = ? AND deleted_at IS NULL ORDER BY id ASC',
      [room_id],
    )
    return rows as Seat[]
  },

  async update(id: number, data: UpdateSeatInput): Promise<Seat | null> {
    const updates: string[] = []
    const values: any[] = []

    if (data.room_id !== undefined) {
      updates.push('room_id = ?')
      values.push(data.room_id)
    }
    if (data.seat_number !== undefined) {
      updates.push('seat_number = ?')
      values.push(data.seat_number)
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      values.push(data.description)
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    values.push(id)

    await pool.query(
      `UPDATE seats SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values,
    )

    return this.findById(id)
  },

  async softDelete(id: number): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE seats SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    return (result as any).affectedRows > 0
  },
}
