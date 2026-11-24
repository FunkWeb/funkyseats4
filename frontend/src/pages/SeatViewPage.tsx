import { Link, useParams, useSearchParams } from 'react-router'
import { useCallback, useEffect, useState } from 'react'
import type { SeatWithFeaturesDto } from '../../../contracts/seat'
import { TIME_PERIODS, type TimePeriod } from '../../../contracts/booking'
import { Button } from '../components/Button'
import { DateNavigator } from '../components/DateNavigator'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { PeriodToggle } from '../components/PeriodToggle'
import { SeatCard } from '../components/SeatCard'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../features/auth/useAuth'
import { CANCEL_ERROR_MESSAGE, PERIOD_LABELS } from '../features/bookings/bookingLabels'
import { useCancelBooking } from '../features/bookings/useCancelBooking'
import { useCreateBooking } from '../features/bookings/useCreateBooking'
import { useRoomBookings } from '../features/bookings/useRoomBookings'
import { useRooms } from '../features/rooms/useRooms'
import {
  getActiveSeatBookings,
  getInitialPeriod,
  getOwnPeriodBookings,
  getPeriodOccupant,
  isPeriodTaken,
} from '../features/seats/seatPeriod'
import { useRoomSeats } from '../features/seats/useRoomSeats'
import { getTodayIsoDate, getValidBookingDate } from '../utils/isoDate'
import styles from './SeatViewPage.module.css'

const PERIOD_SHORT_LABELS: Record<TimePeriod, string> = {
  BEFORE_LUNCH: 'FM',
  AFTER_LUNCH: 'EM',
  ALL_DAY: 'Hele dagen',
}

interface PeriodSelection {
  date: string
  bySeat: Record<number, TimePeriod>
}

function isConflictError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 409
  )
}

export default function SeatViewPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const today = getTodayIsoDate()
  const { user } = useAuth()
  const roomsQuery = useRooms()
  const room = roomsQuery.data?.find((candidate) => candidate.slug === slug)
  const selectedDate = room ? getValidBookingDate(dateParam, today, room.maxDaysAhead) : today
  const seatsQuery = useRoomSeats(room?.id)
  const bookingsQuery = useRoomBookings(room?.id, selectedDate)
  const createBookingMutation = useCreateBooking(room?.id, selectedDate)
  const cancelBookingMutation = useCancelBooking(room?.id, selectedDate)

  const [periodSelection, setPeriodSelection] = useState<PeriodSelection>({
    date: selectedDate,
    bySeat: {},
  })

  const setDate = useCallback(
    (date: string) => {
      setSearchParams(
        (currentSearchParams) => {
          const nextSearchParams = new URLSearchParams(currentSearchParams)
          nextSearchParams.set('date', date)
          return nextSearchParams
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (room && dateParam !== null && dateParam !== selectedDate) {
      setDate(selectedDate)
    }
  }, [dateParam, room, selectedDate, setDate])

  const seats = [...(seatsQuery.data ?? [])].sort((a, b) =>
    a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }),
  )

  const selectedPeriods = periodSelection.date === selectedDate ? periodSelection.bySeat : {}

  function selectPeriod(seatId: number, period: TimePeriod) {
    setPeriodSelection({ date: selectedDate, bySeat: { ...selectedPeriods, [seatId]: period } })
  }

  function handleBook(seatId: number, period: TimePeriod) {
    selectPeriod(seatId, period)
    createBookingMutation.mutate({ seatId, bookingDate: selectedDate, timePeriod: period })
  }

  const bookingErrorMessage = isConflictError(createBookingMutation.error)
    ? 'Plassen er allerede reservert, eller du har allerede en reservasjon i dette tidsrommet.'
    : 'Kunne ikke opprette reservasjon. Prøv igjen senere.'

  if (roomsQuery.isPending) {
    return <Spinner label="Laster rom" />
  }

  if (roomsQuery.isError) {
    return <Notice variant="danger" title="Kunne ikke hente rom" description="Prøv igjen senere." />
  }

  if (!room) {
    return (
      <div className={styles.notFound}>
        <Notice
          title="Fant ikke rom"
          description="Rommet finnes ikke eller er ikke tilgjengelig."
        />
        <Link to="/rooms" className={styles.backLink}>
          Tilbake til romoversikten
        </Link>
      </div>
    )
  }

  const currentUserId = user?.id ?? -1

  function renderSeatCard(seat: SeatWithFeaturesDto) {
    if (bookingsQuery.isPending) {
      return (
        <SeatCard seatName={seat.seatNumber} features={seat.features} freeLabel="Laster..." muted />
      )
    }

    const seatBookings = getActiveSeatBookings(seat.id, bookingsQuery.data ?? [])
    const period = selectedPeriods[seat.id] ?? getInitialPeriod(seatBookings, currentUserId)
    const occupant = getPeriodOccupant(period, seatBookings, currentUserId)
    const bookingFailed =
      createBookingMutation.isError &&
      createBookingMutation.variables.seatId === seat.id &&
      createBookingMutation.variables.bookingDate === selectedDate &&
      createBookingMutation.variables.timePeriod === period
    const cancelFailed =
      cancelBookingMutation.isError &&
      seatBookings.some((booking) => cancelBookingMutation.variables.includes(booking.id))
    const error = bookingFailed
      ? bookingErrorMessage
      : cancelFailed
        ? CANCEL_ERROR_MESSAGE
        : undefined
    const periodControl = (
      <PeriodToggle
        label={`Tidsrom for ${seat.seatNumber}`}
        value={period}
        onChange={(nextPeriod) => selectPeriod(seat.id, nextPeriod)}
        options={TIME_PERIODS.map((option) => ({
          value: option,
          label: PERIOD_SHORT_LABELS[option],
          ariaLabel: PERIOD_LABELS[option],
          taken: isPeriodTaken(option, seatBookings, currentUserId),
        }))}
      />
    )

    if (occupant?.userId === currentUserId) {
      const ownBookingIds = getOwnPeriodBookings(period, seatBookings, currentUserId).map(
        (booking) => booking.id,
      )
      const isCancelling =
        cancelBookingMutation.isPending &&
        ownBookingIds.some((id) => cancelBookingMutation.variables?.includes(id))

      return (
        <SeatCard
          seatName={seat.seatNumber}
          features={seat.features}
          occupant={user ?? undefined}
          occupantDetail={
            ownBookingIds.length > 1 ? PERIOD_LABELS.ALL_DAY : PERIOD_LABELS[occupant.timePeriod]
          }
          error={error}
          periodControl={periodControl}
          actions={
            <Button
              variant="outline"
              disabled={isCancelling}
              onClick={() => cancelBookingMutation.mutate(ownBookingIds)}
            >
              {isCancelling ? 'Avbestiller...' : 'Avbestill reservasjon'}
            </Button>
          }
        />
      )
    }

    if (occupant) {
      return (
        <SeatCard
          seatName={seat.seatNumber}
          features={seat.features}
          occupant={occupant.user}
          occupantDetail={PERIOD_LABELS[occupant.timePeriod]}
          muted
          error={error}
          periodControl={periodControl}
          actions={<Button disabled>Opptatt</Button>}
        />
      )
    }

    const isBooking =
      createBookingMutation.isPending && createBookingMutation.variables?.seatId === seat.id

    return (
      <SeatCard
        seatName={seat.seatNumber}
        features={seat.features}
        error={error}
        periodControl={periodControl}
        actions={
          <Button
            variant="primary"
            disabled={createBookingMutation.isPending}
            onClick={() => handleBook(seat.id, period)}
          >
            {isBooking ? 'Reserverer...' : `Reserver ${PERIOD_LABELS[period].toLowerCase()}`}
          </Button>
        }
      />
    )
  }

  return (
    <>
      <PageHeader title={room.name} />
      {room.description && <p className={styles.description}>{room.description}</p>}
      <DateNavigator
        className={styles.dateNavigator}
        value={selectedDate}
        today={today}
        maxDaysAhead={room.maxDaysAhead}
        onDateChange={setDate}
      />

      {seatsQuery.isPending && <Spinner label="Laster plasser" />}

      {seatsQuery.isError && (
        <Notice
          variant="danger"
          title="Kunne ikke hente plasser"
          description="Prøv igjen senere."
        />
      )}

      {seatsQuery.isSuccess &&
        (seats.length === 0 ? (
          <Notice title="Ingen plasser" description="Dette rommet har ingen plasser." />
        ) : (
          <>
            {bookingsQuery.isError && (
              <Notice
                variant="danger"
                title="Kunne ikke hente reservasjoner"
                description="Prøv igjen senere."
              />
            )}
            <ul className={styles.grid}>
              {seats.map((seat) => (
                <li key={seat.id}>{renderSeatCard(seat)}</li>
              ))}
            </ul>
          </>
        ))}
    </>
  )
}
