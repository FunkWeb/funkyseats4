import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import type { FeatureDto } from '../../../../contracts/feature'
import { FeatureForm, type FeatureFormValues } from './FeatureForm'
import { useCreateFeature } from './useCreateFeature'
import { useUpdateFeature } from './useUpdateFeature'

export type FeatureFormMode = { type: 'create' } | { type: 'edit'; feature: FeatureDto }

export interface FeatureFormModalProps {
  mode: FeatureFormMode | null
  onClose: () => void
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return typeof error.status === 'number' ? error.status : undefined
  }
  return undefined
}

function getNorwegianSubmitError(error: unknown): string {
  const status = getErrorStatus(error)

  if (status === 409) {
    return 'Det finnes allerede en funksjon med dette navnet.'
  }
  if (status === 413) {
    return 'Ikonfilen er for stor (maks 100 KB).'
  }
  if (status === 415) {
    return 'Ugyldig filformat. Kun SVG-filer er tillatt.'
  }
  if (status === 400) {
    return 'Ugyldige data eller ugyldig SVG-fil. Kontroller feltene og prøv igjen.'
  }

  return 'Kunne ikke lagre funksjonen. Prøv igjen senere.'
}

export function FeatureFormModal({ mode, onClose }: FeatureFormModalProps) {
  const createMutation = useCreateFeature()
  const updateMutation = useUpdateFeature()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const feature = mode?.type === 'edit' ? mode.feature : undefined
  const isSaving = createMutation.isPending || updateMutation.isPending

  function handleClose() {
    if (isSaving) return
    setSubmitError(null)
    createMutation.reset()
    updateMutation.reset()
    onClose()
  }

  function handleSuccess() {
    setSubmitError(null)
    createMutation.reset()
    updateMutation.reset()
    onClose()
  }

  function handleSubmit(values: FeatureFormValues) {
    setSubmitError(null)

    const callbacks = {
      onSuccess: handleSuccess,
      onError: (error: Error) => setSubmitError(getNorwegianSubmitError(error)),
    }

    if (mode?.type === 'edit') {
      updateMutation.mutate({ id: mode.feature.id, ...values }, callbacks)
    } else {
      createMutation.mutate(values, callbacks)
    }
  }

  return (
    <Modal
      open={mode !== null}
      title={feature ? 'Rediger funksjon' : 'Legg til funksjon'}
      onClose={handleClose}
    >
      {submitError && (
        <Notice variant="danger" title="Kunne ikke lagre funksjon" description={submitError} />
      )}
      <FeatureForm
        key={feature?.id ?? 'new'}
        initialValues={feature}
        isSaving={isSaving}
        onCancel={handleClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
