import styles from './DateNavigator.module.css'

const officeTimeZone = 'Europe/Oslo'

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  timeZone: officeTimeZone,
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  timeZone: officeTimeZone,
})

const accessibleDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
  timeZone: officeTimeZone,
})

export interface DateNavigatorProps {
  value: string
  today: string
  maxDaysAhead: number
  onDateChange: (date: string) => void
  disabled?: boolean
}

function parseDateOnly(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }

  const date = new Date(`${value}T12:00:00Z`)

  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date
}

function getDateOptions(today: string, maxDaysAhead: number) {
  const startDate = parseDateOnly(today)
  const dayCount = Math.floor(maxDaysAhead)

  if (startDate == null || !Number.isFinite(maxDaysAhead) || dayCount < 0) {
    return []
  }

  return Array.from({ length: dayCount + 1 }, (_, index) => {
    const date = new Date(startDate)
    date.setUTCDate(date.getUTCDate() + index)
    const dateValue = date.toISOString().slice(0, 10)

    return {
      value: dateValue,
      weekday: weekdayFormatter.format(date),
      dateLabel: dateFormatter.format(date),
      accessibleLabel: accessibleDateFormatter.format(date),
    }
  })
}

export function DateNavigator({
  value,
  today,
  maxDaysAhead,
  onDateChange,
  disabled = false,
}: DateNavigatorProps) {
  const dates = getDateOptions(today, maxDaysAhead)

  return (
    <div className={styles.dateNavigator} role="group" aria-label="Choose a booking date">
      {dates.map((date) => (
        <button
          key={date.value}
          className={styles.date}
          type="button"
          aria-label={date.accessibleLabel}
          aria-pressed={value === date.value}
          disabled={disabled}
          onClick={() => onDateChange(date.value)}
        >
          <span className={styles.weekday}>{date.weekday}</span>
          <span className={styles.dateLabel}>{date.dateLabel}</span>
        </button>
      ))}
    </div>
  )
}
