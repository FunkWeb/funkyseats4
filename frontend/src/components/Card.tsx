import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import styles from './Card.module.css'

export const cardVariants = ['default', 'muted'] as const

export type CardVariant = (typeof cardVariants)[number]

export interface CardProps {
  variant?: CardVariant
  children: ReactNode
  className?: string
}

export function Card({ variant = 'default', children, className }: CardProps) {
  const cardClassName = classNames(styles.card, styles[variant], className)

  return <div className={cardClassName}>{children}</div>
}
