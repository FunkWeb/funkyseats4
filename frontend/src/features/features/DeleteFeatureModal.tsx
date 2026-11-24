import type { FeatureDto } from '../../../../contracts/feature'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { useDeleteFeature } from './useDeleteFeature'

export interface DeleteFeatureModalProps {
  feature: FeatureDto | null
  onClose: () => void
}

export function DeleteFeatureModal({ feature, onClose }: DeleteFeatureModalProps) {
  const deleteMutation = useDeleteFeature()
  const errorStatus =
    typeof deleteMutation.error === 'object' &&
    deleteMutation.error !== null &&
    'status' in deleteMutation.error &&
    typeof deleteMutation.error.status === 'number'
      ? deleteMutation.error.status
      : undefined
  const errorDescription =
    errorStatus === 404
      ? 'Funksjonen finnes ikke lenger. Oppdater siden og prøv igjen.'
      : errorStatus === 403
        ? 'Du har ikke tilgang til å slette funksjonen.'
        : 'Kunne ikke slette funksjonen. Prøv igjen.'

  function handleClose() {
    deleteMutation.reset()
    onClose()
  }

  return (
    <Modal
      open={feature !== null}
      title="Slett funksjon?"
      onClose={handleClose}
      footer={
        <>
          <Button
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => feature && deleteMutation.mutate(feature.id, { onSuccess: handleClose })}
          >
            {deleteMutation.isPending ? 'Sletter…' : 'Slett funksjon'}
          </Button>
          <Button variant="outline" disabled={deleteMutation.isPending} onClick={handleClose}>
            Avbryt
          </Button>
        </>
      }
    >
      <p>
        Er du sikker på at du vil slette funksjonen <strong>{feature?.name}</strong>? Funksjonen
        fjernes også fra alle plasser.
      </p>
      {deleteMutation.isError && (
        <Notice variant="danger" title="Det oppstod en feil" description={errorDescription} />
      )}
    </Modal>
  )
}
