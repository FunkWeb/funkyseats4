import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { FieldPacket, Pool, QueryResult, QueryValues } from 'mysql2/promise'
import { createRoomsRepository } from '../../src/repositories/roomsRepository.js'

const createRepository = (responses: unknown[] = []) => {
  const calls: { sql: string; values?: QueryValues }[] = []
  const db = {
    async execute<T extends QueryResult>(sql: string, values?: QueryValues) {
      calls.push({ sql, values })
      const response = responses.shift()
      if (response === undefined) throw new Error('No mock database response configured')
      return [response as T, [] as FieldPacket[]]
    },
  } as Pool

  return { repository: createRoomsRepository(db), calls }
}

describe('RoomRepository', () => {
  it('creates a room and applies optional-field defaults', async () => {
    const { repository, calls } = createRepository([{ insertId: 42 }])

    const id = await repository.create({ slug: 'room-a', name: 'Room A' })

    assert.equal(id, 42)
    assert.deepEqual(calls, [
      {
        sql: `INSERT INTO rooms (slug, name, description, seat_map_path, max_days_ahead)
       VALUES (?, ?, ?, ?, ?)`,
        values: ['room-a', 'Room A', null, null, 7],
      },
    ])
  })

  it('returns an active room by id or null when none exists', async () => {
    const room = {
      id: 42,
      slug: 'room-a',
      name: 'Room A',
      description: null,
      seatMapPath: null,
      maxDaysAhead: 7,
      updatedAt: new Date('2026-01-02T03:04:05.000Z'),
      createdAt: new Date('2026-01-01T03:04:05.000Z'),
    }
    const { repository, calls } = createRepository([[room], []])

    assert.deepEqual(await repository.getById(42), {
      ...room,
      updatedAt: '2026-01-02T03:04:05.000Z',
      createdAt: '2026-01-01T03:04:05.000Z',
    })
    assert.equal(await repository.getById(99), null)
    assert.deepEqual(
      calls.map(({ values }) => values),
      [[42], [99]],
    )
    assert.ok(calls.every(({ sql }) => sql.includes('deleted_at IS NULL')))
    assert.ok(calls.every(({ sql }) => sql.includes('seat_map_path AS seatMapPath')))
  })

  it('returns only active rooms', async () => {
    const rooms = [
      {
        id: 42,
        slug: 'room-a',
        name: 'Room A',
        description: null,
        seatMapPath: null,
        maxDaysAhead: 7,
        updatedAt: '2026-01-02T03:04:05.000Z',
        createdAt: '2026-01-01T03:04:05.000Z',
      },
    ]
    const { repository, calls } = createRepository([rooms])

    assert.deepEqual(await repository.getAll(), rooms)
    assert.ok(calls[0].sql.includes('FROM rooms WHERE deleted_at IS NULL'))
  })

  it('updates allowed room fields and ignores unknown field names', async () => {
    const { repository, calls } = createRepository([{ affectedRows: 1 }])
    const data = Object.assign(
      { name: 'Updated room', maxDaysAhead: 14 },
      { 'name = ?; DROP TABLE rooms; --': 'unsafe' },
    )

    assert.equal(await repository.update(42, data), true)
    assert.deepEqual(calls, [
      {
        sql: 'UPDATE rooms SET name = ?, max_days_ahead = ? WHERE id = ? AND deleted_at IS NULL',
        values: ['Updated room', 14, 42],
      },
    ])
  })

  it('does not query when there are no recognized update fields', async () => {
    const { repository, calls } = createRepository()

    assert.equal(await repository.update(42, {}), false)
    assert.equal(calls.length, 0)
  })

  it('soft-deletes an active room', async () => {
    const { repository, calls } = createRepository([{ affectedRows: 1 }])

    assert.equal(await repository.delete(42), true)
    assert.deepEqual(calls, [
      {
        sql: 'UPDATE rooms SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        values: [42],
      },
    ])
  })
})
