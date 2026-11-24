import { useRef, type KeyboardEvent } from 'react'
import { classNames } from '../utils/classNames'
import styles from './PeriodToggle.module.css'

export interface PeriodToggleOption<T extends string> {
  value: T
  label: string
  taken?: boolean
}

export interface PeriodToggleProps<T extends string> {
  options: PeriodToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp']

export function PeriodToggle<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: PeriodToggleProps<T>) {
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = NEXT_KEYS.includes(event.key) ? 1 : PREVIOUS_KEYS.includes(event.key) ? -1 : 0
    if (step === 0) return

    event.preventDefault()
    const currentIndex = options.findIndex((option) => option.value === value)
    const nextIndex = (currentIndex + step + options.length) % options.length
    onChange(options[nextIndex].value)
    segmentRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={classNames(styles.track, className)}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => {
        const checked = option.value === value

        return (
          <button
            key={option.value}
            ref={(element) => {
              segmentRefs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={classNames(
              styles.segment,
              checked && styles.selected,
              option.taken && styles.taken,
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
