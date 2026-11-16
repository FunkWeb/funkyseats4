import type { RoomDto } from '../../../../contracts/room'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { errorMessage } from '../../utils/errorMessage'
import { useDeleteRoom } from './useRooms'

export interface DeleteRoomModalProps {
  room: RoomDto | null
  onClose: () => void
}

export function DeleteRoomModal({ room, onClose }: DeleteRoomModalProps) {
  const deleteMutation = useDeleteRoom()

  function handleClose() {
    deleteMutation.reset()
    onClose()
  }

  return (
    <Modal
      open={room !== null}
      title="Slett rom?"
      onClose={handleClose}
      footer={
        <>
          <Button
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => room && deleteMutation.mutate(room.id, { onSuccess: handleClose })}
          >
            {deleteMutation.isPending ? 'Sletter…' : 'Slett rom'}
          </Button>
          <Button variant="outline" disabled={deleteMutation.isPending} onClick={handleClose}>
            Avbryt
          </Button>
        </>
      }
    >
      <p>
        Er du sikker på at du vil slette rommet <strong>{room?.name}</strong>?
      </p>
      {deleteMutation.isError && (
        <Notice
          variant="danger"
          title="Det oppstod en feil"
          description={errorMessage(deleteMutation.error, 'Kunne ikke slette rommet. Prøv igjen.')}
        />
      )}
    </Modal>
  )
}
