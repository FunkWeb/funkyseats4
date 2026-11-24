import type { TimePeriod } from '../../../../contracts/booking'

export const PERIOD_LABELS: Record<TimePeriod, string> = {
  BEFORE_LUNCH: 'Før lunsj',
  AFTER_LUNCH: 'Etter lunsj',
  ALL_DAY: 'Hele dagen',
}

export const CANCEL_ERROR_MESSAGE = 'Kunne ikke avbestille reservasjonen. Prøv igjen senere.'
