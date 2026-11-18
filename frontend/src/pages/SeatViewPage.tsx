import { Link, useParams, useSearchParams } from 'react-router'
import { useCallback, useEffect } from 'react'
import { DateNavigator } from '../components/DateNavigator'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { SeatCard } from '../components/SeatCard'
import { Spinner } from '../components/Spinner'
import { useRooms } from '../features/rooms/useRooms'
import { useRoomSeats } from '../features/seats/useRoomSeats'
import { getTodayIsoDate, getValidBookingDate } from '../utils/isoDate'
import styles from './SeatViewPage.module.css'

export default function SeatViewPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const today = getTodayIsoDate()
  const roomsQuery = useRooms()
  const room = roomsQuery.data?.find((candidate) => candidate.slug === slug)
  const selectedDate = room ? getValidBookingDate(dateParam, today, room.maxDaysAhead) : today
  const seatsQuery = useRoomSeats(room?.id)

  const setDate = useCallback(
    (date: string) =>
      setSearchParams(
        (currentSearchParams) => {
          const nextSearchParams = new URLSearchParams(currentSearchParams)
          nextSearchParams.set('date', date)
          return nextSearchParams
        },
        { replace: true },
      ),
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
          <ul className={styles.grid}>
            {seats.map((seat) => (
              <li key={seat.id}>
                <SeatCard seatName={seat.seatNumber} features={[]} freeLabel="Ledig" />
              </li>
            ))}
          </ul>
        ))}
    </>
  )
}
