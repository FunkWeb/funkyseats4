import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import { isValidSeatMapPath } from '../../../contracts/room.js'
import { requireRole } from '../auth/requireRole.js'
import {
  ConflictError,
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
  roomsService: Pick<
    RoomsService,
    'findAll' | 'findById' | 'create' | 'update' | 'delete' | 'isSeatMapInUse'
  >
  seatsService: Pick<SeatsService, 'findByRoom'>
  requireAuth: RequestHandler
  uploadsDir: string
}

type SeatMapExtension = 'png' | 'jpg' | 'webp'

const MAX_SEAT_MAP_BYTES = 2 * 1024 * 1024
const SEAT_MAP_URL_PREFIX = '/seat-maps/'

const ALLOWED_IMAGE_TYPES = new Map<string, SeatMapExtension>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
])

const isMissingPath = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

const hasMatchingMagicBytes = (buffer: Buffer, ext: SeatMapExtension): boolean => {
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

const removeUploadedSeatMap = async (uploadsDir: string, seatMapPath: string) => {
  if (!isValidSeatMapPath(seatMapPath)) return
  const filename = path.basename(seatMapPath)

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

const requireSeatMapContentType: RequestHandler = (req, res, next) => {
  const rawContentType = req.get('content-type') ?? ''
  const mimeType = rawContentType.split(';')[0]?.trim().toLowerCase() ?? ''
  const ext = ALLOWED_IMAGE_TYPES.get(mimeType)
  if (!ext) {
    next(new UnsupportedMediaTypeError('Content-Type must be image/png, image/jpeg, or image/webp'))
    return
  }
  res.locals.seatMapExt = ext
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

  // Runs after the database change has been committed, so a failure here must not fail the
  // request: the file is left behind and logged instead.
  const removeSeatMapIfUnused = async (seatMapPath: string | null) => {
    if (!seatMapPath) return
    try {
      if (await roomsService.isSeatMapInUse(seatMapPath)) return
      await removeUploadedSeatMap(uploadsDir, seatMapPath)
    } catch (error) {
      console.error(`Failed to remove seat map ${seatMapPath}`, error)
    }
  }

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
      await removeSeatMapIfUnused(oldSeatMapPath)
    }
    res.sendStatus(204)
  })

  router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    const oldSeatMapPath = await roomsService.delete(parseId(req.params.id, 'id'))
    await removeSeatMapIfUnused(oldSeatMapPath)
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
      const ext = res.locals.seatMapExt as SeatMapExtension

      if (!Buffer.isBuffer(req.body) || !hasMatchingMagicBytes(req.body, ext)) {
        throw new ValidationError('Uploaded file does not match its Content-Type')
      }

      const seatMapsDir = path.join(uploadsDir, 'seat-maps')
      await fs.mkdir(seatMapsDir, { recursive: true })

      const filename = `${crypto.randomUUID()}.${ext}`
      await fs.writeFile(path.join(seatMapsDir, filename), req.body)

      res.status(201).json({ seatMapPath: `${SEAT_MAP_URL_PREFIX}${filename}` })
    }) satisfies RequestHandler,
  )

  // Lets the client discard an upload that no room ended up using (e.g. the save failed).
  router.delete('/seat-maps/:filename', requireRole('ADMIN'), async (req, res) => {
    const seatMapPath = `${SEAT_MAP_URL_PREFIX}${req.params.filename}`
    if (!isValidSeatMapPath(seatMapPath)) throw new ValidationError('Invalid seat map filename')
    if (await roomsService.isSeatMapInUse(seatMapPath)) {
      throw new ConflictError('Seat map is in use by a room')
    }
    await removeUploadedSeatMap(uploadsDir, seatMapPath)
    res.sendStatus(204)
  })

  return router
}
