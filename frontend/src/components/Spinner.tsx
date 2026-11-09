import styles from './Spinner.module.css'

export const spinnerSizes = ['sm', 'md', 'lg'] as const

export type SpinnerSize = (typeof spinnerSizes)[number]

export interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  const spinnerClassName = [styles.spinner, styles[size], className].filter(Boolean).join(' ')

  return <span role="status" aria-label={label} className={spinnerClassName} />
}
