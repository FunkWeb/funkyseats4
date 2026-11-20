import { useId, type TextareaHTMLAttributes } from 'react'
import styles from './TextArea.module.css'

export interface TextAreaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'className'
> {
  label: string
  error?: string
  helperText?: string
}

export function TextArea({ label, error, helperText, ...textareaProps }: TextAreaProps) {
  const id = useId()
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const describedBy =
    [helperText && helperId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {textareaProps.required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        {...textareaProps}
        className={`${styles.textarea}${error ? ` ${styles.invalid}` : ''}`}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {helperText && (
        <span className={styles.helper} id={helperId}>
          {helperText}
        </span>
      )}
      {error && (
        <span className={styles.error} id={errorId}>
          {error}
        </span>
      )}
    </div>
  )
}
