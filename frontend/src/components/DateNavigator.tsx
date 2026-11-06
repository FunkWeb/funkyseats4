import { useRef } from 'react'
import { classNames } from '../utils/classNames'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { ChevronIcon } from './icons/ChevronIcon'
import styles from './DateNavigator.module.css'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Oslo',
})

export interface DateNavigatorProps {
  value: string
  today: string
  maxDaysAhead: number
  onDateChange: (date: string) => void
  disabled?: boolean
  className?: string
}

const toDate = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`)

function shiftDate(isoDate: string, days: number) {
  const date = toDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function DateNavigator({
  value,
  today,
  maxDaysAhead,
  onDateChange,
  disabled = false,
  className,
}: DateNavigatorProps) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const lastBookableDate = shiftDate(today, maxDaysAhead)

  return (
    <div
      className={classNames(styles.dateNavigator, className)}
      role="group"
      aria-label="Choose a booking date"
    >
      <IconButton
        variant="ghost"
        icon={<ChevronIcon direction="left" />}
        aria-label="Previous day"
        disabled={disabled || value <= today}
        onClick={() => onDateChange(shiftDate(value, -1))}
      />
      <div className={styles.datePicker}>
        <button
          className={styles.currentDate}
          type="button"
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={() => pickerRef.current?.showPicker()}
        >
          <time dateTime={value} aria-live="polite">
            {dateFormatter.format(toDate(value))}
          </time>
        </button>
        <input
          ref={pickerRef}
          className={styles.pickerInput}
          type="date"
          tabIndex={-1}
          aria-hidden
          value={value}
          min={today}
          max={lastBookableDate}
          onChange={(event) => event.target.value && onDateChange(event.target.value)}
        />
      </div>
      <IconButton
        variant="ghost"
        icon={<ChevronIcon direction="right" />}
        aria-label="Next day"
        disabled={disabled || value >= lastBookableDate}
        onClick={() => onDateChange(shiftDate(value, 1))}
      />
      <Button
        variant="outline"
        disabled={disabled || value === today}
        onClick={() => onDateChange(today)}
      >
        Today
      </Button>
    </div>
  )
}
