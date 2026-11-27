import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import type { Server } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import express, { type RequestHandler } from 'express'
import { errorHandler } from '../../src/errors/errorHandler.js'
import type { Room, RoomsRepository } from '../../src/repositories/roomsRepository.js'
import { createRoomsRoutes } from '../../src/routes/roomsRoutes.js'
import { createRoomsService, type RoomsService } from '../../src/services/roomsService.js'
import { createSeatMapStorage } from '../../src/storage/uploadStorage.js'

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])

describe('roomsRoutes seat maps', () => {
  let server: Server
  let baseUrl: string
  let uploadsDir: string
  let currentRole: 'ADMIN' | 'CANDIDATE' = 'ADMIN'
  const roomRecords = new Map<number, Room>()

  const roomsRepository = {
    findAll: async () => [...roomRecords.values()],
    findById: async (id: number) => roomRecords.get(id) ?? null,
    existsBySlug: async (slug: string) => [...roomRecords.values()].some((r) => r.slug === slug),
    existsBySeatMapPath: async (seatMapPath: string) =>
      [...roomRecords.values()].some((r) => r.seatMapPath === seatMapPath),
    create: async () => 99,
    update: async (id: number, input: Parameters<RoomsRepository['update']>[1]) => {
      const room = roomRecords.get(id)
      if (!room) return false
      const updates = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      )
      roomRecords.set(id, { ...room, ...updates })
      return true
    },
    delete: async (id: number) => roomRecords.delete(id),
  } satisfies Pick<
    RoomsRepository,
    'findAll' | 'findById' | 'existsBySlug' | 'existsBySeatMapPath' | 'create' | 'update' | 'delete'
  >

  let roomsService: RoomsService

  const fakeRequireAuth: RequestHandler = (req, _res, next) => {
    req.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      avatarPath: null,
      role: currentRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }
    next()
  }

  const storeRoom = (id: number, seatMapPath: string | null) =>
    roomRecords.set(id, {
      id,
      slug: `room-${id}`,
      name: `Room ${id}`,
      description: null,
      seatMapPath,
      maxDaysAhead: 7,
      deletedAt: null,
      updatedAt: new Date(),
      createdAt: new Date(),
    })

  const seatMapFile = (seatMapPath: string) =>
    path.join(uploadsDir, 'seat-maps', path.basename(seatMapPath))

  const fileExists = (filePath: string) =>
    fs.access(filePath).then(
      () => true,
      () => false,
    )

  const upload = (body: Buffer, contentType: string) =>
    fetch(`${baseUrl}/rooms/seat-maps`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: new Uint8Array(body),
    })

  const uploadPng = async () => {
    const res = await upload(PNG_BYTES, 'image/png')
    assert.equal(res.status, 201)
    return ((await res.json()) as { seatMapPath: string }).seatMapPath
  }

  const patchRoom = (id: number, body: unknown) =>
    fetch(`${baseUrl}/rooms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  before(async () => {
    uploadsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'funkyseats-seat-maps-test-'))
    roomsService = createRoomsService({
      rooms: roomsRepository,
      seatMapStorage: createSeatMapStorage(uploadsDir),
    })

    const app = express()
    app.use(express.json())
    app.use(
      '/rooms',
      createRoomsRoutes({
        bookingsService: { findForRoomOnDate: async () => [] },
        roomsService,
        seatsService: { findByRoom: async () => [] },
        requireAuth: fakeRequireAuth,
      }),
    )
    app.use(errorHandler)

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address()
        if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`
        resolve()
      })
    })
  })

  beforeEach(async () => {
    currentRole = 'ADMIN'
    roomRecords.clear()
    await fs.rm(path.join(uploadsDir, 'seat-maps'), { recursive: true, force: true })
  })

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await fs.rm(uploadsDir, { recursive: true, force: true })
  })

  it('uploads a PNG and saves it to disk', async () => {
    const seatMapPath = await uploadPng()

    assert.match(seatMapPath, /^\/seat-maps\/[a-f0-9-]+\.png$/)
    assert.deepEqual(await fs.readFile(seatMapFile(seatMapPath)), PNG_BYTES)
  })

  it('rejects an unsupported or missing Content-Type with 415', async () => {
    for (const contentType of ['image/gif', 'application/octet-stream', '']) {
      const res = await upload(PNG_BYTES, contentType)
      assert.equal(res.status, 415, contentType)
    }
  })

  it('rejects a body that does not match its Content-Type with 400', async () => {
    const res = await upload(JPEG_BYTES, 'image/png')

    assert.equal(res.status, 400)
  })

  it('rejects files larger than 2 MB with 413', async () => {
    const oversized = Buffer.concat([PNG_BYTES, Buffer.alloc(2 * 1024 * 1024)])
    const res = await upload(oversized, 'image/png')

    assert.equal(res.status, 413)
  })

  it('rejects uploads from non-admins with 403', async () => {
    currentRole = 'CANDIDATE'
    const res = await upload(PNG_BYTES, 'image/png')

    assert.equal(res.status, 403)
  })

  it('rejects a seatMapPath that is not an uploaded seat map', async () => {
    storeRoom(1, null)
    for (const seatMapPath of [
      'https://example.com/map.png',
      '/icons/map.svg',
      '/seat-maps/../secret.png',
      'javascript:alert(1)',
    ]) {
      const res = await patchRoom(1, { seatMapPath })
      assert.equal(res.status, 400, seatMapPath)
    }
  })

  it('removes the old file when the seat map is replaced', async () => {
    const oldPath = await uploadPng()
    const newPath = await uploadPng()
    storeRoom(1, oldPath)

    const res = await patchRoom(1, { seatMapPath: newPath })

    assert.equal(res.status, 204)
    assert.equal(await fileExists(seatMapFile(oldPath)), false)
    assert.equal(await fileExists(seatMapFile(newPath)), true)
  })

  it('keeps the old file when another room still uses it', async () => {
    const sharedPath = await uploadPng()
    storeRoom(1, sharedPath)
    storeRoom(2, sharedPath)

    const res = await patchRoom(1, { seatMapPath: null })

    assert.equal(res.status, 204)
    assert.equal(await fileExists(seatMapFile(sharedPath)), true)
  })

  it('removes the seat map file when the room is deleted', async () => {
    const seatMapPath = await uploadPng()
    storeRoom(1, seatMapPath)

    const res = await fetch(`${baseUrl}/rooms/1`, { method: 'DELETE' })

    assert.equal(res.status, 204)
    assert.equal(await fileExists(seatMapFile(seatMapPath)), false)
  })

  it('discards an unused upload', async () => {
    const seatMapPath = await uploadPng()

    const res = await fetch(`${baseUrl}/rooms${seatMapPath}`, { method: 'DELETE' })

    assert.equal(res.status, 204)
    assert.equal(await fileExists(seatMapFile(seatMapPath)), false)
  })

  it('refuses to discard a seat map that a room uses', async () => {
    const seatMapPath = await uploadPng()
    storeRoom(1, seatMapPath)

    const res = await fetch(`${baseUrl}/rooms${seatMapPath}`, { method: 'DELETE' })

    assert.equal(res.status, 409)
    assert.equal(await fileExists(seatMapFile(seatMapPath)), true)
  })

  it('rejects discarding an invalid filename', async () => {
    const res = await fetch(`${baseUrl}/rooms/seat-maps/not-a-seat-map.txt`, { method: 'DELETE' })

    assert.equal(res.status, 400)
  })
})
