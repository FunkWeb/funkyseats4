import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { SeatWithFeaturesDto } from '../../../../contracts/seat'
import { Button } from '../../components/Button'
import { DataTable, type Column } from '../../components/DataTable'
import { FeatureIcons } from '../../components/FeatureIcons'
import { IconButton } from '../../components/IconButton'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { Select } from '../../components/Select'
import { Spinner } from '../../components/Spinner'
import { PlusIcon } from '../../components/icons/PlusIcon'
import { TrashIcon } from '../../components/icons/TrashIcon'
import { DeleteSeatModal } from '../../features/seats/DeleteSeatModal'
import { SeatFormModal, type SeatFormMode } from '../../features/seats/SeatFormModal'
import { useRoomSeats } from '../../features/seats/useRoomSeats'
import { useRooms } from '../../features/rooms/useRooms'
import styles from './AdminSeatsPage.module.css'

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m14.5 6 3.5 3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function AdminSeatsPage() {
  const roomsQuery = useRooms()
  const [searchParams, setSearchParams] = useSearchParams()
  const roomParam = searchParams.get('room')
  const [formMode, setFormMode] = useState<SeatFormMode | null>(null)
  const [deletingSeat, setDeletingSeat] = useState<{
    seat: SeatWithFeaturesDto
    roomId: number
  } | null>(null)
  const rooms = roomsQuery.data ?? []
  const selectedRoom =
    rooms.find((room) => String(room.id) === roomParam) ?? (rooms.length > 0 ? rooms[0] : undefined)
  const seatsQuery = useRoomSeats(selectedRoom?.id)
  const seats = [...(seatsQuery.data ?? [])].sort((a, b) =>
    a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }),
  )

  useEffect(() => {
    if (!roomsQuery.isSuccess) return

    const nextRoomId = selectedRoom?.id
    if (nextRoomId === undefined && roomParam === null) return
    if (nextRoomId !== undefined && roomParam === String(nextRoomId)) return

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (nextRoomId === undefined) {
          next.delete('room')
        } else {
          next.set('room', String(nextRoomId))
        }
        return next
      },
      { replace: true },
    )
  }, [roomParam, roomsQuery.isSuccess, selectedRoom, setSearchParams])

  const columns: Column<SeatWithFeaturesDto>[] = [
    { key: 'seatNumber', header: 'Plass' },
    {
      key: 'description',
      header: 'Beskrivelse',
      render: (seat) => seat.description || '–',
    },
    {
      key: 'features',
      header: 'Funksjoner',
      render: (seat) => <FeatureIcons features={seat.features} hideLabels />,
    },
    {
      key: 'actions',
      header: 'Handlinger',
      render: (seat) => (
        <div className={styles.actions}>
          <IconButton
            icon={<EditIcon />}
            variant="ghost"
            aria-label={`Rediger plass ${seat.seatNumber}`}
            onClick={() => setFormMode({ type: 'edit', seat, roomId: seat.roomId })}
          />
          <IconButton
            icon={<TrashIcon />}
            variant="danger"
            aria-label={`Slett plass ${seat.seatNumber}`}
            onClick={() => setDeletingSeat({ seat, roomId: seat.roomId })}
          />
        </div>
      ),
    },
  ]

  function changeRoom(value: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('room', value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <>
      <PageHeader title="Admin panel" />

      <section className={styles.section} aria-label="Plasser">
        <SectionHeader
          title="Plasser"
          action={
            selectedRoom ? (
              <Button
                icon={<PlusIcon />}
                onClick={() => setFormMode({ type: 'create', roomId: selectedRoom.id })}
              >
                Legg til plass
              </Button>
            ) : undefined
          }
        />

        {roomsQuery.isPending && <Spinner label="Laster rom" />}
        {roomsQuery.isError && (
          <Notice variant="danger" title="Kunne ikke hente rom" description="Prøv igjen senere." />
        )}
        {roomsQuery.isSuccess && rooms.length === 0 && (
          <Notice title="Ingen rom" description="Opprett et rom før du legger til plasser." />
        )}
        {roomsQuery.isSuccess && selectedRoom && (
          <>
            <Select
              className={styles.roomSelect}
              label="Rom"
              options={rooms.map((room) => ({
                label: room.name,
                value: String(room.id),
              }))}
              value={String(selectedRoom.id)}
              onChange={changeRoom}
            />

            {seatsQuery.isError ? (
              <Notice
                variant="danger"
                title="Kunne ikke hente plasser"
                description="Prøv igjen senere."
              />
            ) : (
              <DataTable
                columns={columns}
                data={seats}
                getRowKey={(seat) => String(seat.id)}
                isLoading={seatsQuery.isPending}
                emptyMessage="Dette rommet har ingen plasser ennå."
              />
            )}
          </>
        )}
      </section>

      <SeatFormModal mode={formMode} onClose={() => setFormMode(null)} />
      <DeleteSeatModal seat={deletingSeat} onClose={() => setDeletingSeat(null)} />
    </>
  )
}
