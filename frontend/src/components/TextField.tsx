import { useId, type ChangeEvent } from 'react'
import styles from './TextField.module.css'

export interface TextFieldProps {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  error?: string
  helperText?: string
  placeholder?: string
}

export function TextField({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder,
}: TextFieldProps) {
  const id = useId()
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const describedBy =
    [helperText && helperId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        className={`${styles.input}${error ? ` ${styles.invalid}` : ''}`}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
