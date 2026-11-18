const officeTimeZone = 'Europe/Oslo'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: officeTimeZone })

const shortDateFormatter = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: officeTimeZone,
})

const toDate = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`)

export const getTodayIsoDate = () => isoDateFormatter.format(new Date())

export function isValidIsoDate(isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return false
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === isoDate
}

export const getLastBookableDate = (today: string, maxDaysAhead: number) =>
  shiftIsoDate(today, maxDaysAhead)

export function getValidBookingDate(date: string | null, today: string, maxDaysAhead: number) {
  const lastBookableDate = getLastBookableDate(today, maxDaysAhead)
  return date && isValidIsoDate(date) && date >= today && date <= lastBookableDate ? date : today
}

export const formatShortDate = (isoDate: string) => shortDateFormatter.format(toDate(isoDate))

export function shiftIsoDate(isoDate: string, days: number) {
  const date = toDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
