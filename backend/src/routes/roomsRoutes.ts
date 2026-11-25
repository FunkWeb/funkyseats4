import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import { requireRole } from '../auth/requireRole.js'
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../errors/appErrors.js'
import { isEntityTooLarge } from '../errors/errorHandler.js'
import type { BookingsService } from '../services/bookingsService.js'
import type { RoomsService } from '../services/roomsService.js'
import type { SeatsService } from '../services/seatsService.js'
import { parseCreateRoom, parseUpdateRoom } from '../validation/roomRequests.js'
import { parseId, parseIsoDate } from '../validation/parsers.js'

export interface RoomsRoutesDeps {
  bookingsService: Pick<BookingsService, 'findForRoomOnDate'>
  roomsService: Pick<RoomsService, 'findAll' | 'findById' | 'create' | 'update' | 'delete'>
  seatsService: Pick<SeatsService, 'findByRoom'>
  requireAuth: RequestHandler
  uploadsDir: string
}

const MAX_SEAT_MAP_BYTES = 2 * 1024 * 1024
const UPLOADED_SEAT_MAP_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/i

const ALLOWED_IMAGE_TYPES = new Map<string, 'png' | 'jpg' | 'webp'>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
])

const isMissingPath = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

const hasMatchingMagicBytes = (buffer: Buffer, ext: 'png' | 'jpg' | 'webp'): boolean => {
  if (ext === 'png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    )
  }
  if (ext === 'jpg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }
  return (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
}

const removeUploadedSeatMap = async (uploadsDir: string, seatMapPath: string | null) => {
  if (!seatMapPath) return
  const filename = path.basename(seatMapPath)
  if (!UPLOADED_SEAT_MAP_PATTERN.test(filename)) return

  const seatMapsDir = path.resolve(uploadsDir, 'seat-maps')
  let realSeatMapsDir: string
  try {
    realSeatMapsDir = await fs.realpath(seatMapsDir)
  } catch (error) {
    if (isMissingPath(error)) return
    throw error
  }

  await fs.rm(path.join(realSeatMapsDir, filename), { force: true })
}

const requireSeatMapContentType: RequestHandler = (req, _res, next) => {
  const rawContentType = req.get('content-type') ?? ''
  const mimeType = rawContentType.split(';')[0]?.trim().toLowerCase() ?? ''
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    next(new UnsupportedMediaTypeError('Content-Type must be image/png, image/jpeg, or image/webp'))
    return
  }
  next()
}

const seatMapTooLarge: ErrorRequestHandler = (error, _req, _res, next) => {
  if (isEntityTooLarge(error)) {
    next(new PayloadTooLargeError('Uploaded seat map must be 2 MB or smaller'))
    return
  }
  next(error)
}

export const createRoomsRoutes = ({
  bookingsService,
  roomsService,
  seatsService,
  requireAuth,
  uploadsDir,
}: RoomsRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (_req, res) => {
    res.json(await roomsService.findAll())
  })

  router.get('/:id', async (req, res) => {
    res.json(await roomsService.findById(parseId(req.params.id, 'id')))
  })

  router.get('/:id/seats', async (req, res) => {
    res.json(await seatsService.findByRoom(parseId(req.params.id, 'id')))
  })

  router.get('/:id/bookings', async (req, res) => {
    const roomId = parseId(req.params.id, 'id')
    const date = parseIsoDate(req.query.date, 'date')
    res.json(await bookingsService.findForRoomOnDate(roomId, date))
  })

  router.post('/', requireRole('ADMIN'), async (req, res) => {
    const id = await roomsService.create(parseCreateRoom(req.body))
    res.status(201).json({ id })
  })

  router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
    const roomId = parseId(req.params.id, 'id')
    const input = parseUpdateRoom(req.body)
    const oldSeatMapPath = await roomsService.update(roomId, input)
    if (input.seatMapPath !== undefined && input.seatMapPath !== oldSeatMapPath) {
      await removeUploadedSeatMap(uploadsDir, oldSeatMapPath)
    }
    res.sendStatus(204)
  })

  router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    await roomsService.delete(parseId(req.params.id, 'id'))
    res.sendStatus(204)
  })

  router.post(
    '/seat-maps',
    requireRole('ADMIN'),
    requireSeatMapContentType,
    express.raw({
      type: ['image/png', 'image/jpeg', 'image/webp'],
      limit: MAX_SEAT_MAP_BYTES,
    }),
    seatMapTooLarge,
    (async (req, res) => {
      const rawContentType = req.get('content-type') ?? ''
      const mimeType = rawContentType.split(';')[0]?.trim().toLowerCase() ?? ''
      const ext = ALLOWED_IMAGE_TYPES.get(mimeType)
      if (!ext) {
        throw new UnsupportedMediaTypeError(
          'Content-Type must be image/png, image/jpeg, or image/webp',
        )
      }

      if (!Buffer.isBuffer(req.body) || !hasMatchingMagicBytes(req.body, ext)) {
        throw new ValidationError('Uploaded file does not match its Content-Type')
      }

      const seatMapsDir = path.join(uploadsDir, 'seat-maps')
      await fs.mkdir(seatMapsDir, { recursive: true })

      const filename = `${crypto.randomUUID()}.${ext}`
      await fs.writeFile(path.join(seatMapsDir, filename), req.body)

      res.status(201).json({ seatMapPath: `/seat-maps/${filename}` })
    }) satisfies RequestHandler,
  )

  return router
}
