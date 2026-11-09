import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'danger' | 'success' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  icon,
  children,
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const classes = classNames(styles.button, styles[variant], className)

  return (
    <button {...buttonProps} className={classes} type={type}>
      {icon != null && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  )
}
