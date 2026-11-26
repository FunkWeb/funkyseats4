import { useState } from 'react'
import {
  BOOKING_STATUSES,
  type AdminBookingDto,
  type BookingStatus,
} from '../../../../contracts/booking'
import { Button } from '../../components/Button'
import { DataTable, type Column } from '../../components/DataTable'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { PaginationControls } from '../../components/PaginationControls'
import { Select } from '../../components/Select'
import { TextField } from '../../components/TextField'
import { UserIdentity } from '../../components/UserIdentity'
import { useCancelBooking } from '../../features/bookings/useCancelBooking'
import {
  CANCEL_ERROR_MESSAGE,
  PERIOD_LABELS,
  STATUS_LABELS,
} from '../../features/bookings/bookingLabels'
import { useAllBookings } from '../../features/bookings/useAllBookings'
import { useRooms } from '../../features/rooms/useRooms'
import { formatShortDate, getTodayIsoDate } from '../../utils/isoDate'
import styles from './AdminBookingsPage.module.css'

const STATUS_OPTIONS = [
  { label: 'Alle statuser', value: '' },
  ...BOOKING_STATUSES.map((value) => ({ label: STATUS_LABELS[value], value })),
]

const isBookingStatus = (value: string): value is BookingStatus =>
  BOOKING_STATUSES.some((status) => status === value)

export default function AdminBookingsPage() {
  const [date, setDate] = useState(getTodayIsoDate)
  const [roomId, setRoomId] = useState('')
  const [status, setStatus] = useState<BookingStatus | ''>('ACTIVE')
  const [page, setPage] = useState(1)
  const [bookingToCancel, setBookingToCancel] = useState<AdminBookingDto | null>(null)
  const rooms = useRooms()
  const bookings = useAllBookings(
    {
      date: date || undefined,
      roomId: roomId ? Number(roomId) : undefined,
      status: status || undefined,
    },
    page,
  )
  const cancelBooking = useCancelBooking()

  const columns: Column<AdminBookingDto>[] = [
    {
      key: 'user',
      header: 'Bruker',
      render: (booking) => (
        <UserIdentity
          name={booking.user.name}
          subtitle={booking.user.email}
          avatarSrc={booking.user.avatarPath ?? undefined}
        />
      ),
    },
    { key: 'roomName', header: 'Rom' },
    { key: 'seatNumber', header: 'Plass' },
    {
      key: 'bookingDate',
      header: 'Dato',
      render: (booking) => formatShortDate(booking.bookingDate),
    },
    {
      key: 'timePeriod',
      header: 'Tidspunkt',
      render: (booking) => PERIOD_LABELS[booking.timePeriod],
    },
    {
      key: 'status',
      header: 'Status',
      render: (booking) => (
        <span className={styles.status} data-status={booking.status}>
          {STATUS_LABELS[booking.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Handlinger',
      render: (booking) =>
        booking.status === 'ACTIVE' ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              cancelBooking.reset()
              setBookingToCancel(booking)
            }}
            disabled={cancelBooking.isPending}
          >
            Avbestill
          </Button>
        ) : null,
    },
  ]

  const closeCancelModal = () => {
    setBookingToCancel(null)
    cancelBooking.reset()
  }

  const confirmCancellation = () => {
    if (!bookingToCancel) return
    cancelBooking.mutate([bookingToCancel.id], {
      onSuccess: () => setBookingToCancel(null),
    })
  }

  return (
    <>
      <PageHeader title="Reservasjoner" />

      <section className={styles.section} aria-labelledby="bookings-heading">
        <div className={styles.intro}>
          <h2 id="bookings-heading" className={styles.heading}>
            Alle reservasjoner
          </h2>
          <p className={styles.description}>
            Se og administrer reservasjoner på tvers av brukere og rom.
          </p>
        </div>

        <div className={styles.filterPanel} role="group" aria-label="Filtrer reservasjoner">
          <h3 className={styles.filterHeading}>Filtrer</h3>
          <div className={styles.filters}>
            <TextField
              label="Fra dato"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setPage(1)
              }}
            />
            <Select
              label="Rom"
              options={[
                { label: 'Alle rom', value: '' },
                ...(rooms.data ?? []).map((room) => ({ label: room.name, value: String(room.id) })),
              ]}
              value={roomId}
              disabled={rooms.isPending}
              onChange={(value) => {
                setRoomId(value)
                setPage(1)
              }}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(value) => {
                if (value === '' || isBookingStatus(value)) setStatus(value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {bookings.isError && (
          <Notice
            variant="danger"
            title="Kunne ikke hente reservasjoner"
            description="Prøv igjen senere."
          />
        )}
        {rooms.isError && (
          <Notice variant="danger" title="Kunne ikke hente rom" description="Prøv igjen senere." />
        )}

        <DataTable
          className={styles.table}
          columns={columns}
          data={bookings.data?.items ?? []}
          getRowKey={(booking) => String(booking.id)}
          isLoading={bookings.isPending}
          emptyMessage="Ingen reservasjoner funnet."
        />
        {bookings.data && (
          <div className={styles.tableFooter}>
            <p className={styles.resultCount}>
              {bookings.data.total}{' '}
              {bookings.data.total === 1 ? 'reservasjon totalt' : 'reservasjoner totalt'}
            </p>
            <PaginationControls
              page={page}
              pageSize={bookings.data.pageSize}
              total={bookings.data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      <Modal
        open={bookingToCancel !== null}
        title="Avbestill reservasjon"
        onClose={() => {
          if (!cancelBooking.isPending) closeCancelModal()
        }}
        footer={
          <>
            <Button variant="outline" onClick={closeCancelModal} disabled={cancelBooking.isPending}>
              Behold reservasjon
            </Button>
            <Button
              variant="danger"
              onClick={confirmCancellation}
              disabled={cancelBooking.isPending}
            >
              Avbestill
            </Button>
          </>
        }
      >
        {bookingToCancel && (
          <p>
            Vil du avbestille reservasjonen til {bookingToCancel.user.name} den{' '}
            {formatShortDate(bookingToCancel.bookingDate)}?
          </p>
        )}
        {cancelBooking.isError && (
          <Notice variant="danger" title="Avbestilling feilet" description={CANCEL_ERROR_MESSAGE} />
        )}
      </Modal>
    </>
  )
}
