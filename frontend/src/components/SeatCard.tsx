import type { SeatDto } from '../../../contracts/seat'
import { classNames } from '../utils/classNames'
import styles from './SeatCard.module.css'

export type SeatCardState = 'available' | 'selected' | 'booked' | 'unavailable'

export interface SeatCardProps {
  seat: Pick<SeatDto, 'id' | 'seatNumber'>
  state: SeatCardState
  onSelect?: (seatId: number) => void
  disabled?: boolean
}

const stateLabels: Record<SeatCardState, string> = {
  available: 'Available',
  selected: 'Selected',
  booked: 'Booked',
  unavailable: 'Unavailable',
}

export function SeatCard({ seat, state, onSelect, disabled = false }: SeatCardProps) {
  const className = classNames(styles.seatCard, styles[state])
  const content = (
    <>
      <span className={styles.seatNumber}>{seat.seatNumber}</span>
      <span className={styles.status}>{stateLabels[state]}</span>
    </>
  )

  if (!onSelect) {
    return <div className={className}>{content}</div>
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-pressed={state === 'selected'}
      onClick={() => onSelect(seat.id)}
    >
      {content}
    </button>
  )
}
