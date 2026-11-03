import styles from './Select.module.css'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps {
  label: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
}

export function Select({ label, options, value, onChange, id, className }: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  const containerClassName = [styles.container, className].filter(Boolean).join(' ')

  return (
    <div className={containerClassName}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        id={selectId}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
