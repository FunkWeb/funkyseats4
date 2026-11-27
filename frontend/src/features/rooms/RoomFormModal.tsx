import type { RoomDto } from '../../../../contracts/room'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { errorMessage } from '../../utils/errorMessage'
import { RoomForm } from './RoomForm'
import { useSaveRoom } from './useRooms'

export type RoomFormMode = { type: 'create' } | { type: 'edit'; room: RoomDto }

export interface RoomFormModalProps {
  mode: RoomFormMode | null
  onClose: () => void
}

const formId = 'room-form'

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return typeof error.status === 'number' ? error.status : undefined
  }
  return undefined
}

function getNorwegianRoomSubmitError(error: unknown): string {
  const status = getErrorStatus(error)

  if (status === 409) {
    return 'Det finnes allerede et rom med denne slug-en.'
  }
  if (status === 413) {
    return 'Romkartet er for stort (maks 2 MB).'
  }
  if (status === 415) {
    return 'Ugyldig filformat. Kun PNG, JPEG og WebP er tillatt.'
  }
  if (status === 400) {
    return 'Ugyldige data eller ugyldig bildefil. Kontroller feltene og prøv igjen.'
  }

  return errorMessage(error, 'Kunne ikke lagre rommet. Prøv igjen.')
}

export function RoomFormModal({ mode, onClose }: RoomFormModalProps) {
  const room = mode?.type === 'edit' ? mode.room : undefined
  const saveMutation = useSaveRoom()

  function handleClose() {
    if (saveMutation.isPending) return
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
            {saveMutation.isPending ? 'Lagrer...' : 'Lagre'}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={saveMutation.isPending}>
            Avbryt
          </Button>
        </>
      }
    >
      {saveMutation.isError && (
        <Notice
          variant="danger"
          title="Det oppstod en feil"
          description={getNorwegianRoomSubmitError(saveMutation.error)}
        />
      )}
      <RoomForm
        key={room?.id ?? 'new'}
        id={formId}
        room={room}
        disabled={saveMutation.isPending}
        onSubmit={({ input, seatMapFile }) => {
          saveMutation.mutate({ roomId: room?.id, input, seatMapFile }, { onSuccess: handleClose })
        }}
      />
    </Modal>
  )
}
