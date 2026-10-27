import type { Pool } from 'mysql2/promise'
import { createRoomsRepository } from '../src/repositories/roomsRepository.js'
import { createSeatsRepository } from '../src/repositories/seatsRepository.js'
import { createUsersRepository } from '../src/repositories/usersRepository.js'

const TABLES_CHILDREN_FIRST = ['bookings', 'seat_features', 'features', 'seats', 'rooms', 'users']

export const createFixtures = (db: Pool) => {
  const users = createUsersRepository(db)
  const rooms = createRoomsRepository(db)
  const seats = createSeatsRepository(db)

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

  const storeSeat = (roomId: number, seatNumber: string) =>
    seats.create({ roomId, seatNumber, description: null })

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

  return { reset, storeUser, storeRoom, deleteRoom: rooms.delete, storeSeat, seedFreshOffice }
}

export type Fixtures = ReturnType<typeof createFixtures>
