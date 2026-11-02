import type { CreateRoomRequest, UpdateRoomRequest } from '../../../contracts/room.js'
import {
  asRecord,
  parseIfPresent,
  parseNonEmptyString,
  parseOptionalString,
  parsePositiveInteger,
} from './parsers.js'

const parseRoomDetails = (fields: Record<string, unknown>) => ({
  description: parseIfPresent(fields.description, (value) =>
    parseOptionalString(value, 'description'),
  ),
  seatMapPath: parseIfPresent(fields.seatMapPath, (value) =>
    parseOptionalString(value, 'seatMapPath'),
  ),
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
