import { useState } from 'react'
import { TileCard } from './TileCard'
import styles from './SortableGrid.module.css'

export interface Seat {
  id: string | number
  label?: string
  seatNumber?: string
  [key: string]: unknown
}

export type SeatLayout = (string | number)[]

export interface SortableGridProps {
  seats: Seat[]
  layout: SeatLayout
  onLayoutChange: (layout: SeatLayout) => void
  onReset?: () => void
  disabled?: boolean
  className?: string
}

export function SortableGrid({
  seats,
  layout,
  onLayoutChange,
  disabled = false,
  className,
}: SortableGridProps) {
  const [draggedId, setDraggedId] = useState<string | number | null>(null)

  const containerClassName = [styles.sortableGrid, className].filter(Boolean).join(' ')

  const orderedSeats = layout
    .map((id) => seats.find((seat) => seat.id === id))
    .filter((seat): seat is Seat => Boolean(seat))

  const moveSeat = (fromIndex: number, toIndex: number) => {
    if (disabled || toIndex < 0 || toIndex >= layout.length) return
    const newLayout = [...layout]
    const [movedItem] = newLayout.splice(fromIndex, 1)
    newLayout.splice(toIndex, 0, movedItem)
    onLayoutChange(newLayout)
  }

  const handleDragStart = (id: string | number) => {
    if (disabled) return
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string | number) => {
    if (disabled || draggedId === null || draggedId === targetId) return
    const fromIndex = layout.indexOf(draggedId)
    const toIndex = layout.indexOf(targetId)
    if (fromIndex !== -1 && toIndex !== -1) {
      moveSeat(fromIndex, toIndex)
    }
    setDraggedId(null)
  }

  return (
    <div className={containerClassName}>
      {orderedSeats.map((seat, index) => {
        const displayLabel = seat.seatNumber || seat.label || String(seat.id)
        const numericId = typeof seat.id === 'number' ? seat.id : Number(seat.id) || index

        return (
          <div
            key={seat.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(seat.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(seat.id)}
            className={styles.itemWrapper}
          >
            <TileCard
              seat={{ id: numericId, seatNumber: displayLabel }}
              state="available"
              onSelect={() => {}}
              disabled={disabled}
            />
            {!disabled && (
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.moveButton}
                  onClick={() => moveSeat(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move ${displayLabel} left`}
                >
                  ←
                </button>
                <button
                  type="button"
                  className={styles.moveButton}
                  onClick={() => moveSeat(index, index + 1)}
                  disabled={index === orderedSeats.length - 1}
                  aria-label={`Move ${displayLabel} right`}
                >
                  →
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
