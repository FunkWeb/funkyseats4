import type { RoomDto } from '../../../../contracts/room'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { errorMessage } from '../../utils/errorMessage'
import { RoomForm } from './RoomForm.jsx'
import { useSaveRoom } from './useRooms'

export type RoomFormMode = { type: 'create' } | { type: 'edit'; room: RoomDto }

export interface RoomFormModalProps {
  mode: RoomFormMode | null
  onClose: () => void
}

const formId = 'room-form'

export function RoomFormModal({ mode, onClose }: RoomFormModalProps) {
  const room = mode?.type === 'edit' ? mode.room : undefined
  const saveMutation = useSaveRoom()

  function handleClose() {
    saveMutation.reset()
    onClose()
  }

  return (
    <Modal
      open={mode !== null}
      title={room ? 'Rediger rom' : 'Legg til rom'}
      onClose={handleClose}
      footer={
        <>
          <Button type="submit" form={formId} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Lagrer…' : 'Lagre'}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
        </>
      }
    >
      {saveMutation.isError && (
        <Notice
          variant="danger"
          title="Det oppstod en feil"
          description={errorMessage(saveMutation.error, 'Kunne ikke lagre rommet. Prøv igjen.')}
        />
      )}
      <RoomForm
        key={room?.id ?? 'new'}
        id={formId}
        room={room}
        onSubmit={(input) =>
          saveMutation.mutate({ roomId: room?.id, input }, { onSuccess: handleClose })
        }
      />
    </Modal>
  )
}
