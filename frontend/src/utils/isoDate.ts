const officeTimeZone = 'Europe/Oslo'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: officeTimeZone })

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: officeTimeZone,
})

const toDate = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`)

export const getTodayIsoDate = () => isoDateFormatter.format(new Date())

export const formatShortDate = (isoDate: string) => shortDateFormatter.format(toDate(isoDate))

export function shiftIsoDate(isoDate: string, days: number) {
  const date = toDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
