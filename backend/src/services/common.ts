import { NotFoundError } from '../errors/appErrors.js'

export const findOrThrow = async <T>(lookup: Promise<T | null>, resource: string): Promise<T> => {
  const found = await lookup
  if (found === null) throw new NotFoundError(resource)
  return found
}

const OFFICE_TIME_ZONE = 'Europe/Oslo'

export const todayInOffice = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: OFFICE_TIME_ZONE }).format(new Date())

export const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
