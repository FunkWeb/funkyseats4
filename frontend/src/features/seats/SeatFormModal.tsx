import type { SeatWithFeaturesDto } from '../../../../contracts/seat'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { Spinner } from '../../components/Spinner'
import { HttpError } from '../../api/errors'
import { errorMessage } from '../../utils/errorMessage'
import { useFeatures } from '../features/useFeatures'
import { SeatForm } from './SeatForm'
import { useSaveSeat } from './useRoomSeats'

export type SeatFormMode =
  { type: 'create'; roomId: number } | { type: 'edit'; seat: SeatWithFeaturesDto; roomId: number }

export interface SeatFormModalProps {
  mode: SeatFormMode | null
  onClose: () => void
}

const formId = 'seat-form'

export function SeatFormModal({ mode, onClose }: SeatFormModalProps) {
  const seat = mode?.type === 'edit' ? mode.seat : undefined
  const featuresQuery = useFeatures()
  const saveMutation = useSaveSeat()

  function handleClose() {
    saveMutation.reset()
    onClose()
  }

  const isFeatureLoading = featuresQuery.isPending
  const hasFeatureError = featuresQuery.isError

  return (
    <Modal
      open={mode !== null}
      title={seat ? 'Rediger plass' : 'Legg til plass'}
      onClose={handleClose}
      footer={
        <>
          <Button
            type="submit"
            form={formId}
            disabled={saveMutation.isPending || isFeatureLoading || hasFeatureError}
          >
            {saveMutation.isPending ? 'Lagrer…' : 'Lagre'}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
        </>
      }
    >
      {isFeatureLoading && <Spinner label="Laster funksjoner" />}
      {hasFeatureError && (
        <Notice
          variant="danger"
          title="Kunne ikke hente funksjoner"
          description="Prøv igjen senere."
        />
      )}
      {saveMutation.isError && (
        <Notice
          variant="danger"
          title={
            saveMutation.error instanceof HttpError && saveMutation.error.status === 409
              ? 'Plassnummeret er allerede i bruk'
              : 'Det oppstod en feil'
          }
          description={
            saveMutation.error instanceof HttpError && saveMutation.error.status === 409
              ? 'Velg et annet plassnummer for dette rommet.'
              : errorMessage(saveMutation.error, 'Kunne ikke lagre plassen. Prøv igjen.')
          }
        />
      )}
      {mode && featuresQuery.isSuccess && (
        <SeatForm
          key={seat?.id ?? 'new'}
          id={formId}
          seat={seat}
          features={featuresQuery.data}
          onSubmit={(values) =>
            saveMutation.mutate(
              { roomId: mode.roomId, seat, ...values },
              { onSuccess: handleClose },
            )
          }
        />
      )}
    </Modal>
  )
}
