import type { SeatWithFeaturesDto } from '../../../../contracts/seat'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { errorMessage } from '../../utils/errorMessage'
import { useDeleteSeat } from './useRoomSeats'

export interface DeleteSeatModalProps {
  seat: { seat: SeatWithFeaturesDto; roomId: number } | null
  onClose: () => void
}

export function DeleteSeatModal({ seat, onClose }: DeleteSeatModalProps) {
  const deleteMutation = useDeleteSeat()

  function handleClose() {
    deleteMutation.reset()
    onClose()
  }

  return (
    <Modal
      open={seat !== null}
      title="Slett plass?"
      onClose={handleClose}
      footer={
        <>
          <Button
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() =>
              seat &&
              deleteMutation.mutate(
                { seatId: seat.seat.id, roomId: seat.roomId },
                { onSuccess: handleClose },
              )
            }
          >
            {deleteMutation.isPending ? 'Sletter…' : 'Slett plass'}
          </Button>
          <Button variant="outline" disabled={deleteMutation.isPending} onClick={handleClose}>
            Avbryt
          </Button>
        </>
      }
    >
      <p>
        Er du sikker på at du vil slette plassen <strong>{seat?.seat.seatNumber}</strong>?
      </p>
      <p>Eldre reservasjoner beholdes.</p>
      {deleteMutation.isError && (
        <Notice
          variant="danger"
          title="Det oppstod en feil"
          description={errorMessage(deleteMutation.error, 'Kunne ikke slette plassen. Prøv igjen.')}
        />
      )}
    </Modal>
  )
}
