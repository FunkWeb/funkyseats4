import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'status' | 'danger' | 'success'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: styles.primary,
  accent: styles.accent,
  outline: styles.outline,
  status: styles.status,
  danger: styles.danger,
  success: styles.success,
}

export function Button({
  variant = 'primary',
  icon,
  children,
  className,
  disabled = false,
  tabIndex,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const isStatus = variant === 'status'
  const classes = [styles.button, variantClasses[variant], className].filter(Boolean).join(' ')

  return (
    <button
      {...buttonProps}
      className={classes}
      disabled={isStatus || disabled}
      tabIndex={isStatus ? -1 : tabIndex}
      type={type}
    >
      {icon !== undefined ? (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  )
}
