import { useRef } from 'react'
import { classNames } from '../utils/classNames'
import { formatShortDate, shiftIsoDate } from '../utils/isoDate'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { ChevronIcon } from './icons/ChevronIcon'
import styles from './DateNavigator.module.css'

export interface DateNavigatorProps {
  value: string
  today: string
  maxDaysAhead: number
  onDateChange: (date: string) => void
  disabled?: boolean
  className?: string
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
  const lastBookableDate = shiftIsoDate(today, maxDaysAhead)

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
        onClick={() => onDateChange(shiftIsoDate(value, -1))}
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
            {formatShortDate(value)}
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
        onClick={() => onDateChange(shiftIsoDate(value, 1))}
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
