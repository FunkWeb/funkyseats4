import { useState } from 'react'
import type { MyBookingDto } from '../../../contracts/booking'
import { Card } from '../components/Card'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { PaginationControls } from '../components/PaginationControls'
import { Spinner } from '../components/Spinner'
import { UserIdentity } from '../components/UserIdentity'
import { useAuth } from '../features/auth/useAuth'
import { CANCEL_ERROR_MESSAGE } from '../features/bookings/bookingLabels'
import { MyBookingList } from '../features/bookings/MyBookingList'
import { useCancelBooking } from '../features/bookings/useCancelBooking'
import { useMyBookings } from '../features/bookings/useMyBookings'
import { getTodayIsoDate } from '../utils/isoDate'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const [page, setPage] = useState(1)
  const { user } = useAuth()
  const today = getTodayIsoDate()
  const bookingsQuery = useMyBookings(page)
  const cancelMutation = useCancelBooking()
  const bookings = bookingsQuery.data?.items ?? []
  const todayBookings = bookings.filter((booking) => booking.bookingDate === today)
  const otherBookings = bookings.filter((booking) => booking.bookingDate !== today)

  const listProps = {
    today,
    cancelDisabled: cancelMutation.isPending,
    onCancel: (booking: MyBookingDto) => cancelMutation.mutate([booking.id]),
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

      {cancelMutation.isError && (
        <Notice
          className={styles.cancelError}
          variant="danger"
          title="Avbestilling feilet"
          description={CANCEL_ERROR_MESSAGE}
        />
      )}

      {bookingsQuery.isSuccess && bookings.length === 0 && (
        <Notice title="Ingen reservasjoner" description="Du har ingen reservasjoner." />
      )}

      {bookingsQuery.isSuccess && bookings.length > 0 && (
        <>
          <MyBookingList title="I dag" bookings={todayBookings} {...listProps} />
          <MyBookingList title="Andre reservasjoner" bookings={otherBookings} {...listProps} />
          <PaginationControls
            page={page}
            pageSize={bookingsQuery.data.pageSize}
            total={bookingsQuery.data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  )
}
