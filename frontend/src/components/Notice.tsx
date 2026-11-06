import { classNames } from '../utils/classNames'
import { IconButton } from './IconButton'
import styles from './Notice.module.css'

export const noticeVariants = ['info', 'success', 'warning', 'danger'] as const

export type NoticeVariant = (typeof noticeVariants)[number]

const urgentVariants: readonly NoticeVariant[] = ['warning', 'danger']

export interface NoticeProps {
  title: string
  description: string
  variant?: NoticeVariant
  onClose?: () => void
  className?: string
}

export function Notice({ title, description, variant = 'info', onClose, className }: NoticeProps) {
  const containerClassName = classNames(styles.container, styles[variant], className)
  const role = urgentVariants.includes(variant) ? 'alert' : 'status'

  return (
    <div className={containerClassName} role={role}>
      <div className={styles.content}>
        <strong className={styles.title}>{title}</strong>
        <p className={styles.description}>{description}</p>
      </div>

      {onClose && <IconButton icon="✕" onClick={onClose} aria-label="Lukk" variant="ghost" />}
    </div>
  )
}
