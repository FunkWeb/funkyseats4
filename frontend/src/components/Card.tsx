import type { ReactNode } from 'react'
import styles from './Card.module.css'

export const cardVariants = ['default', 'muted'] as const

export type CardVariant = (typeof cardVariants)[number]

export interface CardProps {
  variant?: CardVariant
  children: ReactNode
  className?: string
}

export function Card({ variant = 'default', children, className }: CardProps) {
  const cardClassName = [styles.card, styles[variant], className].filter(Boolean).join(' ')

  return <div className={cardClassName}>{children}</div>
}
