import { classNames } from '../utils/classNames'
import styles from './Spinner.module.css'

export const spinnerSizes = ['sm', 'md', 'lg'] as const

export type SpinnerSize = (typeof spinnerSizes)[number]

export interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" className={classNames(styles.spinner, styles[size], className)}>
      <span className={styles.visuallyHidden}>{label}</span>
    </span>
  )
}
