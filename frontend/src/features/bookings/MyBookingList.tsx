import type { MyBookingDto } from '../../../../contracts/booking'
import { MyBookingCard } from './MyBookingCard'
import styles from './MyBookingList.module.css'

export interface MyBookingListProps {
  title: string
  bookings: MyBookingDto[]
  today: string
  cancelDisabled: boolean
  onCancel: (booking: MyBookingDto) => void
}

const isCancellable = (booking: MyBookingDto, today: string) =>
  booking.status === 'ACTIVE' && booking.bookingDate >= today

export function MyBookingList({
  title,
  bookings,
  today,
  cancelDisabled,
  onCancel,
}: MyBookingListProps) {
  if (bookings.length === 0) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.list}>
        {bookings.map((booking) => (
          <li key={booking.id}>
            <MyBookingCard
              booking={booking}
              cancelDisabled={cancelDisabled}
              onCancel={isCancellable(booking, today) ? () => onCancel(booking) : undefined}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
