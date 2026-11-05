import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import type { ButtonVariant } from './Button'
import buttonStyles from './Button.module.css'
import styles from './IconButton.module.css'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode
  variant?: ButtonVariant
  'aria-label': string
}

export function IconButton({
  icon,
  variant = 'primary',
  className,
  type = 'button',
  ...buttonProps
}: IconButtonProps) {
  const classes = classNames(buttonStyles.button, buttonStyles[variant], styles.iconOnly, className)

  return (
    <button {...buttonProps} className={classes} type={type}>
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
    </button>
  )
}
