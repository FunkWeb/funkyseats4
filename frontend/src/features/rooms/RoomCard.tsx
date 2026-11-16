import type { RoomDto } from '../../../../contracts/room'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import { TrashIcon } from '../../components/icons/TrashIcon'
import styles from './RoomCard.module.css'

export interface RoomCardProps {
  room: RoomDto
  onEdit: () => void
  onDelete: () => void
}

export function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.heading}>
        <h3 className={styles.name}>{room.name}</h3>
        <IconButton
          icon={<TrashIcon />}
          variant="danger"
          aria-label={`Slett rom ${room.name}`}
          onClick={onDelete}
        />
      </div>
      {room.description && <p className={styles.description}>{room.description}</p>}
      <Button variant="outline" onClick={onEdit}>
        Rediger rom
      </Button>
    </Card>
  )
}
