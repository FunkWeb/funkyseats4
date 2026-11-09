import { useId, type SelectHTMLAttributes } from 'react'
import { classNames } from '../utils/classNames'
import styles from './Select.module.css'

export interface SelectOption {
  label: string
  value: string
}

type NativeSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'defaultValue' | 'onChange' | 'children' | 'multiple'
>

export interface SelectProps extends NativeSelectProps {
  label: string
  options: SelectOption[]
  value: string | null
  placeholder?: string
  onChange: (value: string) => void
}

export function Select({
  label,
  options,
  value,
  placeholder,
  onChange,
  id,
  className,
  ...selectProps
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const containerClassName = classNames(styles.container, className)

  return (
    <div className={containerClassName}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        {...selectProps}
        id={selectId}
        className={styles.select}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {value === null && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
