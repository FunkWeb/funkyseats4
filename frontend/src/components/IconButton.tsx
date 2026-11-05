import type { ReactNode } from 'react'
import styles from './IconButton.module.css'

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface IconButtonProps {
  icon: ReactNode
  onClick?: () => void
  variant?: IconButtonVariant
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function IconButton({
  icon,
  onClick,
  variant = 'primary',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: IconButtonProps) {
  const buttonClassName = [styles.button, styles[variant], className].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <span className={styles.iconWrapper}>{icon}</span>
    </button>
  )
}
