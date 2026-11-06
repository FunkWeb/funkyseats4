import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import styles from './SectionHeader.module.css'

export type SectionHeadingLevel = 'h1' | 'h2' | 'h3'

export interface SectionHeaderProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  as?: SectionHeadingLevel
  className?: string
}

export function SectionHeader({ title, description, action, as: Heading = 'h2', className }: SectionHeaderProps) {
  return (
    <header className={classNames(styles.header, className)}>
      <div className={styles.text}>
        <Heading className={classNames(styles.title, styles[Heading])}>{title}</Heading>
        {description != null && <p className={styles.description}>{description}</p>}
      </div>
      {action != null && <div className={styles.action}>{action}</div>}
    </header>
  )
}
