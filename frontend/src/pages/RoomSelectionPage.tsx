import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getRooms } from '../api/roomsApi'
import { Card } from '../components/Card'
import { Notice } from '../components/Notice'
import { PageHeader } from '../components/PageHeader'
import { Spinner } from '../components/Spinner'
import styles from './RoomSelectionPage.module.css'

export default function RoomSelectionPage() {
  const {
    data: rooms,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
  })

  return (
    <>
      <PageHeader title="Velg rom" />

      {isPending && <Spinner label="Laster rom" />}

      {isError && (
        <Notice variant="danger" title="Kunne ikke hente rom" description="Prøv igjen senere." />
      )}

      {rooms?.length === 0 && <Notice title="Ingen rom" description="Det finnes ingen rom ennå." />}

      {rooms && rooms.length > 0 && (
        <ul className={styles.list}>
          {rooms.map((room) => (
            <li key={room.id}>
              <Link to={`/rooms/${room.id}`} className={styles.link}>
                <Card className={styles.room}>
                  <span className={styles.name}>{room.name}</span>
                  {room.description && (
                    <span className={styles.description}>{room.description}</span>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
