import { Link } from 'react-router'
import type { MyBookingDto } from '../../../../contracts/booking'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { classNames } from '../../utils/classNames'
import { formatShortDate } from '../../utils/isoDate'
import { PERIOD_LABELS, STATUS_LABELS } from './bookingLabels'
import styles from './MyBookingCard.module.css'

export interface MyBookingCardProps {
  booking: MyBookingDto
  onCancel?: () => void
  cancelDisabled?: boolean
}

export function MyBookingCard({ booking, onCancel, cancelDisabled = false }: MyBookingCardProps) {
  return (
    <Card className={styles.booking}>
      <div className={styles.field}>
        <span className={styles.label}>Dato</span>
        <strong>{formatShortDate(booking.bookingDate)}</strong>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Tidspunkt</span>
        <span>{PERIOD_LABELS[booking.timePeriod]}</span>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Rom</span>
        <Link className={styles.roomLink} to={`/rooms/${booking.roomSlug}`}>
          {booking.roomName}
        </Link>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Plass</span>
        <span>{booking.seatNumber}</span>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Status</span>
        <span className={classNames(styles.status, styles[booking.status.toLowerCase()])}>
          {STATUS_LABELS[booking.status]}
        </span>
      </div>
      {onCancel && (
        <Button variant="danger" size="sm" disabled={cancelDisabled} onClick={onCancel}>
          Avbestill
        </Button>
      )}
    </Card>
  )
}
