import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'danger' | 'success'

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
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ')

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
