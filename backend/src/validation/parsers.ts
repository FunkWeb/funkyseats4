import type { Pagination } from '../../../contracts/pagination.js'
import { ValidationError } from '../errors/appErrors.js'

export const parsePositiveInteger = (value: unknown, field: string) => {
  const id = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
  if (!Number.isInteger(id) || id <= 0)
    throw new ValidationError(`${field} must be a positive integer`)
  return id
}

export const parseId = parsePositiveInteger

const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export const parseIsoDate = (value: unknown, field: string) => {
  if (!isIsoDate(value)) throw new ValidationError(`${field} must be a valid YYYY-MM-DD date`)
  return value
}

export const parseOneOf = <T extends string>(
  allowed: readonly T[],
  value: unknown,
  field: string,
): T => {
  if (!allowed.includes(value as T))
    throw new ValidationError(`${field} must be one of ${allowed.join(', ')}`)
  return value as T
}

export const parseNonEmptyString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !value.trim())
    throw new ValidationError(`${field} must be a non-empty string`)
  return value.trim()
}

export const parseOptionalString = (value: unknown, field: string) =>
  value === undefined || value === null ? null : parseNonEmptyString(value, field)

export const parseIfPresent = <T>(value: unknown, parse: (value: unknown) => T) =>
  value === undefined ? undefined : parse(value)

export const asRecord = (body: unknown): Record<string, unknown> =>
  typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export const parsePagination = (query: Record<string, unknown>): Pagination => {
  const page = parseIfPresent(query.page, (value) => parsePositiveInteger(value, 'page')) ?? 1
  const pageSize =
    parseIfPresent(query.pageSize, (value) => parsePositiveInteger(value, 'pageSize')) ??
    DEFAULT_PAGE_SIZE
  if (pageSize > MAX_PAGE_SIZE)
    throw new ValidationError(`pageSize must be at most ${MAX_PAGE_SIZE}`)
  return { page, pageSize }
}
