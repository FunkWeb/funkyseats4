import { useId } from 'react'
import { type TimePeriod } from '../../../contracts/booking'
import { getTodayIsoDate } from '../utils/isoDate'
import { DateNavigator } from './DateNavigator'
import { TimeSlotPicker } from './TimeSlotPicker'
import styles from './BookingGroup.module.css'

export interface BookingGroupProps {
  date: string
  onDateChange: (date: string) => void
  timePeriod: TimePeriod | null
  availablePeriods: TimePeriod[]
  onTimePeriodChange: (period: TimePeriod) => void
  isLoading: boolean
  disabled: boolean
}

export function BookingGroup({
  date,
  onDateChange,
  timePeriod,
  availablePeriods,
  onTimePeriodChange,
  isLoading,
  disabled,
}: BookingGroupProps) {
  const titleId = useId()
  const controlsDisabled = isLoading || disabled
  const availableSet = new Set(availablePeriods)

  return (
    <section className={styles.bookingGroup} aria-labelledby={titleId} aria-busy={isLoading}>
      <h2 className={styles.title} id={titleId}>
        Booking options
      </h2>
      <DateNavigator
        value={date}
        today={getTodayIsoDate()}
        onDateChange={onDateChange}
        disabled={controlsDisabled}
      />
      <TimeSlotPicker
        value={timePeriod}
        availablePeriods={availablePeriods}
        onChange={(period) => {
          if (!controlsDisabled && availableSet.has(period)) {
            onTimePeriodChange(period)
          }
        }}
        disabled={controlsDisabled}
      />
    </section>
  )
}
