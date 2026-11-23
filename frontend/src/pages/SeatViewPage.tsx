import { Link, useParams, useSearchParams } from 'react-router'
import { useCallback, useEffect, useState } from 'react'
import type { SeatDto } from '../../../contracts/seat'
import type { TimePeriod } from '../../../contracts/booking'
import { Button } from '../components/Button'
import { DateNavigator } from '../components/DateNavigator'
import { Modal } from '../components/Modal'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { SeatCard } from '../components/SeatCard'
import { Spinner } from '../components/Spinner'
import { TimeSlotPicker } from '../components/TimeSlotPicker'
import { useAuth } from '../features/auth/useAuth'
import { useCancelBooking } from '../features/bookings/useCancelBooking'
import { useCreateBooking } from '../features/bookings/useCreateBooking'
import { useRoomBookings } from '../features/bookings/useRoomBookings'
import { useRooms } from '../features/rooms/useRooms'
import { getSeatAvailability } from '../features/seats/seatAvailability'
import { useRoomSeats } from '../features/seats/useRoomSeats'
import { getTodayIsoDate, getValidBookingDate } from '../utils/isoDate'
import styles from './SeatViewPage.module.css'

const PERIOD_LABELS: Record<TimePeriod, string> = {
  BEFORE_LUNCH: 'Før lunsj',
  AFTER_LUNCH: 'Etter lunsj',
  ALL_DAY: 'Hele dagen',
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

  const [bookingSeat, setBookingSeat] = useState<SeatDto | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null)

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

  function openBookingModal(seat: SeatDto) {
    setBookingSeat(seat)
    setSelectedPeriod(null)
    setBookingError(null)
    createBookingMutation.reset()
  }

  function closeBookingModal() {
    if (createBookingMutation.isPending) return
    setBookingSeat(null)
    setSelectedPeriod(null)
    setBookingError(null)
  }

  function handleConfirmBooking() {
    if (!bookingSeat || !selectedPeriod) return
    setBookingError(null)

    createBookingMutation.mutate(
      {
        seatId: bookingSeat.id,
        bookingDate: selectedDate,
        timePeriod: selectedPeriod,
      },
      {
        onSuccess: () => {
          setBookingSeat(null)
          setSelectedPeriod(null)
          setBookingError(null)
        },
        onError: (error) => {
          if (isConflictError(error)) {
            setBookingError(
              'Plassen er allerede reservert, eller du har allerede en reservasjon i dette tidsrommet.',
            )
          } else {
            setBookingError('Kunne ikke opprette reservasjon. Prøv igjen senere.')
          }
        },
      },
    )
  }

  function handleCancelBooking(bookingId: number) {
    setCancelError(null)
    setCancellingBookingId(bookingId)

    cancelBookingMutation.mutate(bookingId, {
      onError: () => {
        setCancelError('Kunne ikke avbestille reservasjonen. Prøv igjen senere.')
      },
      onSettled: () => {
        setCancellingBookingId(null)
      },
    })
  }

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

  const bookingSeatAvailability = bookingSeat
    ? getSeatAvailability(bookingSeat.id, bookingsQuery.data ?? [], user?.id ?? -1)
    : null

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
            {cancelError && (
              <Notice variant="danger" title="Avbestilling feilet" description={cancelError} />
            )}
            <ul className={styles.grid}>
              {seats.map((seat) => {
                if (bookingsQuery.isPending) {
                  return (
                    <li key={seat.id}>
                      <SeatCard
                        seatName={seat.seatNumber}
                        features={seat.features}
                        freeLabel="Laster..."
                      />
                    </li>
                  )
                }

                const availability = getSeatAvailability(
                  seat.id,
                  bookingsQuery.data ?? [],
                  user?.id ?? -1,
                )

                if (availability.status === 'yours') {
                  const bookingId = availability.yourBookingId
                  const isCancelling =
                    cancelBookingMutation.isPending && cancellingBookingId === bookingId

                  return (
                    <li key={seat.id}>
                      <SeatCard
                        seatName={seat.seatNumber}
                        features={seat.features}
                        occupant={
                          user ? { name: user.name, avatarPath: user.avatarPath } : undefined
                        }
                        status={
                          availability.yourPeriod
                            ? `Din reservasjon (${PERIOD_LABELS[availability.yourPeriod]})`
                            : 'Din reservasjon'
                        }
                        actions={
                          bookingId !== undefined ? (
                            <Button
                              variant="ghost"
                              disabled={isCancelling}
                              onClick={() => handleCancelBooking(bookingId)}
                            >
                              Avbestill
                            </Button>
                          ) : undefined
                        }
                      />
                    </li>
                  )
                }

                if (availability.status === 'booked') {
                  return (
                    <li key={seat.id}>
                      <SeatCard
                        seatName={seat.seatNumber}
                        features={seat.features}
                        freeLabel="Opptatt"
                        muted
                        status="Opptatt hele dagen"
                      />
                    </li>
                  )
                }

                if (availability.status === 'partlyBooked') {
                  const freeHalfLabel = availability.availablePeriods.includes('BEFORE_LUNCH')
                    ? 'Ledig før lunsj'
                    : 'Ledig etter lunsj'

                  return (
                    <li key={seat.id}>
                      <SeatCard
                        seatName={seat.seatNumber}
                        features={seat.features}
                        freeLabel="Delvis ledig"
                        status={freeHalfLabel}
                        actions={
                          <Button variant="primary" onClick={() => openBookingModal(seat)}>
                            Reserver
                          </Button>
                        }
                      />
                    </li>
                  )
                }

                return (
                  <li key={seat.id}>
                    <SeatCard
                      seatName={seat.seatNumber}
                      features={seat.features}
                      freeLabel="Ledig"
                      actions={
                        <Button variant="primary" onClick={() => openBookingModal(seat)}>
                          Reserver
                        </Button>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </>
        ))}

      <Modal
        open={bookingSeat !== null}
        title={bookingSeat ? bookingSeat.seatNumber : ''}
        onClose={closeBookingModal}
        footer={
          <>
            <Button
              variant="ghost"
              disabled={createBookingMutation.isPending}
              onClick={closeBookingModal}
            >
              Avbryt
            </Button>
            <Button
              variant="primary"
              disabled={selectedPeriod === null || createBookingMutation.isPending}
              onClick={handleConfirmBooking}
            >
              Bekreft reservasjon
            </Button>
          </>
        }
      >
        {bookingError && (
          <Notice variant="danger" title="Kunne ikke reservere" description={bookingError} />
        )}
        {bookingSeatAvailability && (
          <TimeSlotPicker
            value={selectedPeriod}
            availablePeriods={bookingSeatAvailability.availablePeriods}
            onChange={setSelectedPeriod}
            disabled={createBookingMutation.isPending}
          />
        )}
      </Modal>
    </>
  )
}
