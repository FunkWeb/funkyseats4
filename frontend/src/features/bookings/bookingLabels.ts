import type { BookingStatus, TimePeriod } from '../../../../contracts/booking'

export const PERIOD_LABELS: Record<TimePeriod, string> = {
  BEFORE_LUNCH: 'Før lunsj',
  AFTER_LUNCH: 'Etter lunsj',
  ALL_DAY: 'Hele dagen',
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  ACTIVE: 'Aktiv',
  COMPLETE: 'Fullført',
  CANCELLED: 'Avbestilt',
}

export const CANCEL_ERROR_MESSAGE = 'Kunne ikke avbestille reservasjonen. Prøv igjen senere.'
