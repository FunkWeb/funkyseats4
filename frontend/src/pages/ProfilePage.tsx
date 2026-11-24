import { useState } from 'react'
import { Link } from 'react-router'
import type { BookingStatus, MyBookingDto, TimePeriod } from '../../../contracts/booking'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { Spinner } from '../components/Spinner'
import { UserIdentity } from '../components/UserIdentity'
import { useAuth } from '../features/auth/useAuth'
import { useCancelBooking } from '../features/bookings/useCancelBooking'
import { useMyBookings } from '../features/bookings/useMyBookings'
import { formatShortDate, getTodayIsoDate } from '../utils/isoDate'
import styles from './ProfilePage.module.css'

const PERIOD_LABELS: Record<TimePeriod, string> = {
  BEFORE_LUNCH: 'Før lunsj',
  AFTER_LUNCH: 'Etter lunsj',
  ALL_DAY: 'Hele dagen',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  ACTIVE: 'Aktiv',
  COMPLETE: 'Fullført',
  CANCELLED: 'Avbestilt',
}

export default function ProfilePage() {
  const [page, setPage] = useState(1)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const { user } = useAuth()
  const bookingsQuery = useMyBookings(page)
  const cancelMutation = useCancelBooking(undefined, getTodayIsoDate())
  const today = getTodayIsoDate()

  const cancelBooking = (booking: MyBookingDto) => {
    setCancelError(null)
    setCancellingId(booking.id)
    cancelMutation.mutate([booking.id], {
      onError: () => setCancelError('Kunne ikke avbestille reservasjonen. Prøv igjen senere.'),
      onSettled: () => setCancellingId(null),
    })
  }

  return (
    <>
      <PageHeader title="Mine reservasjoner" />

      {user && (
        <Card variant="muted" className={styles.identity}>
          <UserIdentity
            name={user.name}
            subtitle={user.email}
            avatarSrc={user.avatarPath ?? undefined}
            size="lg"
          />
        </Card>
      )}

      {bookingsQuery.isPending && <Spinner label="Laster reservasjoner" />}

      {bookingsQuery.isError && (
        <Notice
          variant="danger"
          title="Kunne ikke hente reservasjoner"
          description="Prøv igjen senere."
        />
      )}

      {cancelError && (
        <Notice
          className={styles.cancelError}
          variant="danger"
          title="Avbestilling feilet"
          description={cancelError}
        />
      )}

      {bookingsQuery.isSuccess && bookingsQuery.data.items.length === 0 && (
        <Notice title="Ingen reservasjoner" description="Du har ingen reservasjoner." />
      )}

      {bookingsQuery.isSuccess && bookingsQuery.data.items.length > 0 && (
        <>
          <ul className={styles.list}>
            {bookingsQuery.data.items.map((booking) => (
              <li key={booking.id}>
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
                    <span className={`${styles.status} ${styles[booking.status.toLowerCase()]}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                  {booking.status === 'ACTIVE' && booking.bookingDate >= today && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={cancellingId !== null}
                      onClick={() => cancelBooking(booking)}
                    >
                      Avbestill
                    </Button>
                  )}
                </Card>
              </li>
            ))}
          </ul>

          {bookingsQuery.data.total > bookingsQuery.data.pageSize && (
            <div className={styles.paging}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Forrige
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * bookingsQuery.data.pageSize >= bookingsQuery.data.total}
                onClick={() => setPage((current) => current + 1)}
              >
                Neste
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
