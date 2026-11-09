import { useId } from 'react'
import { TIME_PERIODS, type TimePeriod } from '../../../contracts/booking'
import { classNames } from '../utils/classNames'
import styles from './TimeSlotPicker.module.css'

export interface TimeSlotPickerProps {
  value: TimePeriod | null
  availablePeriods: TimePeriod[]
  onChange: (period: TimePeriod) => void
  disabled?: boolean
  unavailableReason?: (period: TimePeriod) => string | undefined
}

const periodLabels: Record<TimePeriod, string> = {
  BEFORE_LUNCH: 'Before lunch',
  AFTER_LUNCH: 'After lunch',
  ALL_DAY: 'All day',
}

export function TimeSlotPicker({
  value,
  availablePeriods,
  onChange,
  disabled = false,
  unavailableReason,
}: TimeSlotPickerProps) {
  const groupId = useId()
  const availableSet = new Set(availablePeriods)

  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend className={styles.legend}>Booking period</legend>
      <div className={styles.options}>
        {TIME_PERIODS.map((period) => {
          const isAvailable = availableSet.has(period)
          const reason = !isAvailable ? unavailableReason?.(period) : undefined
          const reasonId = `${groupId}-${period}-reason`

          return (
            <label
              className={classNames(
                styles.option,
                value === period && styles.selected,
                !isAvailable && styles.unavailable,
              )}
              key={period}
            >
              <input
                className={styles.input}
                type="radio"
                name={groupId}
                value={period}
                checked={value === period}
                disabled={!isAvailable}
                aria-describedby={reason ? reasonId : undefined}
                onChange={() => onChange(period)}
              />
              <span className={styles.label}>{periodLabels[period]}</span>
              {reason && (
                <span className={styles.reason} id={reasonId}>
                  {reason}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
