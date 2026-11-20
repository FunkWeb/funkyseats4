import { useId, type InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className'
> {
  label: string
  error?: string
  helperText?: string
}

export function TextField({ label, error, helperText, ...inputProps }: TextFieldProps) {
  const id = useId()
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const describedBy =
    [helperText && helperId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {inputProps.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        {...inputProps}
        className={`${styles.input}${error ? ` ${styles.invalid}` : ''}`}
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
