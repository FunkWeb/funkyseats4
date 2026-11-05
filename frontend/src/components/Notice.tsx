import type { ReactNode } from 'react'
import { IconButton } from './IconButton'
import styles from './Notice.module.css'

export type NoticeVariant = 'info' | 'success' | 'warning' | 'error'

export interface NoticeProps {
  title: string
  description: string
  variant?: NoticeVariant
  onClose?: () => void
  className?: string
}

export function Notice({ title, description, variant = 'info', onClose, className }: NoticeProps) {
  const containerClassName = [styles.container, styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClassName} role="alert">
      <div className={styles.content}>
        <strong className={styles.title}>{title}</strong>
        <p className={styles.description}>{description}</p>
      </div>

      {onClose && <IconButton icon="✕" onClick={onClose} aria-label="Lukk" variant="ghost" />}
    </div>
  )
}
