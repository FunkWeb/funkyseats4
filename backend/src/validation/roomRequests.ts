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
