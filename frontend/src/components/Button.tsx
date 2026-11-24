import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { classNames } from '../utils/classNames'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'danger' | 'success' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>
  variant?: ButtonVariant
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
  size?: 'md' | 'sm'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  icon,
  iconPosition = 'start',
  size = 'md',
  children,
  className,
  ref,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  const classes = classNames(styles.button, styles[variant], size === 'sm' && styles.sm, className)
  const iconElement = icon != null && (
    <span className={styles.icon} aria-hidden>
      {icon}
    </span>
  )

  return (
    <button {...buttonProps} ref={ref} className={classes} type={type}>
      {iconPosition === 'start' && iconElement}
      <span>{children}</span>
      {iconPosition === 'end' && iconElement}
    </button>
  )
}
