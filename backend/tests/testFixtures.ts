import type { Pool, ResultSetHeader } from 'mysql2/promise'
import { createRoomsRepository } from '../src/repositories/roomsRepository.js'
import { createUsersRepository } from '../src/repositories/usersRepository.js'

const TABLES_CHILDREN_FIRST = ['bookings', 'seat_features', 'seats', 'rooms', 'users']

export const createFixtures = (db: Pool) => {
  const users = createUsersRepository(db)
  const rooms = createRoomsRepository(db)

  const reset = async () => {
    for (const table of TABLES_CHILDREN_FIRST) await db.query(`DELETE FROM ${table}`)
  }

  const storeUser = (name: string) =>
    users.create({
      googleId: `google-${name}`,
      name,
      email: `${name}@example.com`,
      avatarPath: null,
      role: 'CANDIDATE',
    })

  const storeRoom = (slug: string, maxDaysAhead?: number) =>
    rooms.create({ slug, name: slug, maxDaysAhead })

  const storeSeat = async (roomId: number, seatNumber: string) => {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO seats (room_id, seat_number) VALUES (:roomId, :seatNumber)',
      { roomId, seatNumber },
    )
    return result.insertId
  }

  const seedFreshOffice = async (maxDaysAhead?: number) => {
    await reset()
    const roomId = await storeRoom('room-a', maxDaysAhead)
    return {
      roomId,
      alice: await storeUser('alice'),
      bob: await storeUser('bob'),
      seatA: await storeSeat(roomId, 'A1'),
      seatB: await storeSeat(roomId, 'A2'),
    }
  }

  return { storeRoom, deleteRoom: rooms.delete, storeSeat, seedFreshOffice }
}

export type Fixtures = ReturnType<typeof createFixtures>
