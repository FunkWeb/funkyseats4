import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { FeatureForm, type FeatureFormValues } from './FeatureForm'
import { useCreateFeature } from './useCreateFeature'

export interface FeatureFormModalProps {
  open: boolean
  onClose: () => void
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status
    return typeof status === 'number' ? status : undefined
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

export function FeatureFormModal({ open, onClose }: FeatureFormModalProps) {
  const createFeatureMutation = useCreateFeature()
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleClose() {
    if (createFeatureMutation.isPending) return
    setSubmitError(null)
    createFeatureMutation.reset()
    onClose()
  }

  function handleSubmit(values: FeatureFormValues) {
    setSubmitError(null)

    createFeatureMutation.mutate(values, {
      onSuccess: () => {
        setSubmitError(null)
        createFeatureMutation.reset()
        onClose()
      },
      onError: (error) => {
        setSubmitError(getNorwegianSubmitError(error))
      },
    })
  }

  return (
    <Modal open={open} title="Legg til funksjon" onClose={handleClose}>
      {submitError && (
        <Notice variant="danger" title="Kunne ikke lagre funksjon" description={submitError} />
      )}
      <FeatureForm
        isSaving={createFeatureMutation.isPending}
        onCancel={handleClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
