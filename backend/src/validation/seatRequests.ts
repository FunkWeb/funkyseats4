import type { CreateSeatRequest, UpdateSeatRequest } from '../../../contracts/seat.js'
import { ValidationError } from '../errors/appErrors.js'
import { asRecord, parseId } from './parsers.js'

const parseSeatNumber = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > 10) {
    throw new ValidationError('seatNumber must be a non-empty string of at most 10 characters')
  }

  return value.trim()
}

const parseDescription = (value: unknown): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    throw new ValidationError('description must be a string or null')
  }

  return value
}

export const parseCreateSeat = (body: unknown): CreateSeatRequest => {
  const { roomId, seatNumber, description } = asRecord(body)

  return {
    roomId: parseId(roomId, 'roomId'),
    seatNumber: parseSeatNumber(seatNumber),
    description: parseDescription(description),
  }
}

export const parseUpdateSeat = (body: unknown): UpdateSeatRequest => {
  const { roomId, seatNumber, description } = asRecord(body)
  const seat: UpdateSeatRequest = {}

  if (roomId !== undefined) seat.roomId = parseId(roomId, 'roomId')
  if (seatNumber !== undefined) seat.seatNumber = parseSeatNumber(seatNumber)
  if (description !== undefined) seat.description = parseDescription(description)

  return seat
}