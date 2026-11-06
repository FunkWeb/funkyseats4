import type { SeatDto } from '../../../contracts/seat'
import styles from './TileCard.module.css'

export type TileCardState = 'available' | 'selected' | 'booked' | 'unavailable'

export interface TileCardProps {
  seat: Pick<SeatDto, 'id' | 'seatNumber'>
  state: TileCardState
  onSelect: (seatId: number) => void
  disabled?: boolean
}

const stateLabels: Record<TileCardState, string> = {
  available: 'Available',
  selected: 'Selected',
  booked: 'Booked',
  unavailable: 'Unavailable',
}

export function TileCard({ seat, state, onSelect, disabled = false }: TileCardProps) {
  const isDisabled = disabled || state !== 'available'
  const statusLabel = stateLabels[state]
  const className = `${styles.tile} ${styles[state]}`

  return (
    <button
      type="button"
      className={className}
      disabled={isDisabled}
      aria-label={`Seat ${seat.seatNumber}, ${statusLabel}`}
      onClick={() => onSelect(seat.id)}
    >
      <span className={styles.seatNumber} aria-hidden="true">
        {seat.seatNumber}
      </span>
      <span className={styles.status} aria-hidden="true">
        {statusLabel}
      </span>
    </button>
  )
}
