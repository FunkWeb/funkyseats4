import type { ReactNode } from 'react'
import '../../styles/tokens.css'
import styles from './Card.module.css'

export type CardVariant = 'default' | 'muted'

export interface CardProps {
  variant?: CardVariant
  children: ReactNode
  className?: string
}

export function Card({ variant = 'default', children, className }: CardProps) {
  const variantClass = variant === 'muted' ? styles.muted : ''
  const cardClassName = [styles.card, variantClass, className].filter(Boolean).join(' ')

  return <div className={cardClassName}>{children}</div>
}
