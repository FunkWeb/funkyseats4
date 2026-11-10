import { Button } from './Button'
import styles from './FormActions.module.css'

export interface FormActionsProps {
  isDirty?: boolean
  isSaving?: boolean
  onCancel?: () => void
  className?: string
}

export function FormActions({
  isDirty = false,
  isSaving = false,
  onCancel,
  className,
}: FormActionsProps) {
  const containerClassName = [styles.formActions, className].filter(Boolean).join(' ')

  const isSaveDisabled = !isDirty || isSaving

  return (
    <div className={containerClassName}>
      <Button type="submit" disabled={isSaveDisabled}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
      <Button type="button" variant="accent" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
