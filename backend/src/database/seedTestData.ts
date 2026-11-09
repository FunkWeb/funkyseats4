import { createDbConfig } from '../config/createConfig.js'
import { createRoomsRepository } from '../repositories/roomsRepository.js'
import { createSeatsRepository } from '../repositories/seatsRepository.js'
import { createPool } from './createPool.js'

const TEST_OFFICE = [
  { slug: 'open-office', name: 'Open office', seatNumbers: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'] },
  { slug: 'quiet-room', name: 'Quiet room', seatNumbers: ['Q1', 'Q2', 'Q3'] },
]

const main = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed test data into a production database')
  }

  const db = createPool(createDbConfig(process.env))
  const rooms = createRoomsRepository(db)
  const seats = createSeatsRepository(db)

  try {
    for (const { slug, name, seatNumbers } of TEST_OFFICE) {
      if (await rooms.existsBySlug(slug)) {
        console.log(`Skipped: ${slug} already exists`)
        continue
      }
      const roomId = await rooms.create({ slug, name })
      for (const seatNumber of seatNumbers) {
        await seats.create({ roomId, seatNumber, description: null })
      }
      console.log(`Seeded test room: ${slug} (${seatNumbers.join(', ')})`)
    }
  } finally {
    await db.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
