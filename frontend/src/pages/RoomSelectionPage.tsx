import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import styles from './RoomSelectionPage.module.css'

const placeholderRooms = ['Rom 1', 'Rom 2', 'Rom 3']

export default function RoomSelectionPage() {
  return (
    <>
      <PageHeader title="Velg rom" />
      <ul className={styles.list}>
        {placeholderRooms.map((room) => (
          <li key={room}>
            <Card className={styles.room}>{room}</Card>
          </li>
        ))}
      </ul>
    </>
  )
}
