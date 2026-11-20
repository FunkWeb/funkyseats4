import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { RoomDto } from '../../../../contracts/room'
import { Button } from '../../components/Button'
import { PlusIcon } from '../../components/icons/PlusIcon'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { Spinner } from '../../components/Spinner'
import { DeleteRoomModal } from '../../features/rooms/DeleteRoomModal'
import { RoomCard } from '../../features/rooms/RoomCard'
import { RoomFormModal, type RoomFormMode } from '../../features/rooms/RoomFormModal'
import { useRooms } from '../../features/rooms/useRooms'
import styles from './AdminRoomsPage.module.css'

export default function AdminRoomsPage() {
  const { data: rooms, isPending, isError } = useRooms()
  const navigate = useNavigate()
  const [formMode, setFormMode] = useState<RoomFormMode | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<RoomDto | null>(null)

  return (
    <>
      <PageHeader title="Admin panel" />

      <section className={styles.section} aria-labelledby="rooms-heading">
        <div className={styles.sectionHeader}>
          <h2 id="rooms-heading" className={styles.heading}>
            Rom
          </h2>
          <Button icon={<PlusIcon />} onClick={() => setFormMode({ type: 'create' })}>
            Legg til rom
          </Button>
        </div>

        {isPending && <Spinner label="Laster rom" />}
        {isError && (
          <Notice variant="danger" title="Kunne ikke hente rom" description="Prøv igjen senere." />
        )}
        {rooms?.length === 0 && (
          <Notice title="Ingen rom" description="Det finnes ingen rom ennå." />
        )}

        {rooms && rooms.length > 0 && (
          <ul className={styles.roomList}>
            {rooms.map((room) => (
              <li key={room.id}>
                <RoomCard
                  room={room}
                  onEdit={() => setFormMode({ type: 'edit', room })}
                  onDelete={() => setDeletingRoom(room)}
                  onManageSeats={() => navigate(`/admin/seats?room=${room.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <RoomFormModal mode={formMode} onClose={() => setFormMode(null)} />
      <DeleteRoomModal room={deletingRoom} onClose={() => setDeletingRoom(null)} />
    </>
  )
}
