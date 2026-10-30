import { ValidationError } from '../errors/appErrors.js'

export const parseId = (value: unknown, field: string) => {
  const id = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
  if (!Number.isInteger(id) || id <= 0)
    throw new ValidationError(`${field} must be a positive integer`)
  return id
}

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)

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

export const asRecord = (body: unknown): Record<string, unknown> =>
  typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

export const parseNonEmptyString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !value.trim())
    throw new ValidationError(`${field} must be a non-empty string`)
  return value.trim()
}

export const parseOptionalString = (value: unknown, field: string) =>
  value === undefined || value === null ? null : parseNonEmptyString(value, field)
