import type { SeatDto } from '../../../contracts/seat'
import styles from './SeatCard.module.css'

export type Seat = Pick<SeatDto, 'id' | 'seatNumber'>

export type SeatState = 'available' | 'selected' | 'booked' | 'unavailable'

export interface SeatCardProps {
  seat: Seat
  state: SeatState
  onSelect?: (seatId: number) => void
  disabled?: boolean
}

const stateLabels: Record<SeatState, string> = {
  available: 'Available',
  selected: 'Selected',
  booked: 'Booked',
  unavailable: 'Unavailable',
}

export function SeatCard({ seat, state, onSelect, disabled = false }: SeatCardProps) {
  const className = [styles.seat, styles[state]].join(' ')
  const stateLabel = stateLabels[state]
  const content = (
    <>
      <span className={styles.seatNumber}>{seat.seatNumber}</span>
      <span className={styles.state}>{stateLabel}</span>
    </>
  )

  if (onSelect && (state === 'available' || state === 'selected')) {
    return (
      <button
        aria-label={`Seat ${seat.seatNumber}, ${stateLabel}`}
        aria-pressed={state === 'selected'}
        className={className}
        disabled={disabled}
        onClick={() => onSelect(seat.id)}
        type="button"
      >
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
