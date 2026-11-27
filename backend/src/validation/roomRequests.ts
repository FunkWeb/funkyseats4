import {
  isValidSeatMapPath,
  type CreateRoomRequest,
  type UpdateRoomRequest,
} from '../../../contracts/room.js'
import { ValidationError } from '../errors/appErrors.js'
import {
  asRecord,
  parseIfPresent,
  parseNonEmptyString,
  parseOptionalString,
  parsePositiveInteger,
} from './parsers.js'

export type SeatMapExtension = 'png' | 'jpg' | 'webp'

const SEAT_MAP_SIGNATURES: Record<SeatMapExtension, { offset: number; bytes: Buffer }[]> = {
  png: [{ offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }],
  jpg: [{ offset: 0, bytes: Buffer.from([0xff, 0xd8, 0xff]) }],
  webp: [
    { offset: 0, bytes: Buffer.from('RIFF', 'ascii') },
    { offset: 8, bytes: Buffer.from('WEBP', 'ascii') },
  ],
}

const hasSignatureAt = (buffer: Buffer, offset: number, signature: Buffer) =>
  buffer.subarray(offset, offset + signature.length).equals(signature)

export const validateSeatMapContent = (body: unknown, ext: SeatMapExtension): Buffer => {
  const matches =
    Buffer.isBuffer(body) &&
    SEAT_MAP_SIGNATURES[ext].every(({ offset, bytes }) => hasSignatureAt(body, offset, bytes))
  if (!matches) throw new ValidationError('Uploaded file does not match its Content-Type')
  return body
}

const parseSeatMapPath = (value: unknown): string | null => {
  const parsed = parseOptionalString(value, 'seatMapPath')
  if (parsed === null) return null
  if (!isValidSeatMapPath(parsed)) {
    throw new ValidationError('seatMapPath must be an uploaded image under /seat-maps/')
  }
  return parsed
}

const parseRoomDetails = (fields: Record<string, unknown>) => ({
  description: parseIfPresent(fields.description, (value) =>
    parseOptionalString(value, 'description'),
  ),
  seatMapPath: parseIfPresent(fields.seatMapPath, parseSeatMapPath),
  maxDaysAhead: parseIfPresent(fields.maxDaysAhead, (value) =>
    parsePositiveInteger(value, 'maxDaysAhead'),
  ),
})

export const parseCreateRoom = (body: unknown): CreateRoomRequest => {
  const fields = asRecord(body)
  return {
    slug: parseNonEmptyString(fields.slug, 'slug'),
    name: parseNonEmptyString(fields.name, 'name'),
    ...parseRoomDetails(fields),
  }
}

export const parseUpdateRoom = (body: unknown): UpdateRoomRequest => {
  const fields = asRecord(body)
  return {
    slug: parseIfPresent(fields.slug, (value) => parseNonEmptyString(value, 'slug')),
    name: parseIfPresent(fields.name, (value) => parseNonEmptyString(value, 'name')),
    ...parseRoomDetails(fields),
  }
}
