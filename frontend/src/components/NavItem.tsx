import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import styles from './NavItem.module.css'

export interface NavItemProps {
  label: string
  href?: string
  icon?: ReactNode
  isCurrent?: boolean
  isNested?: boolean
}

export function NavItem({ label, href, icon, isCurrent = false, isNested = false }: NavItemProps) {
  const className = classNames(
    styles.navItem,
    isNested && styles.nested,
    isCurrent && styles.active,
  )
  const content = (
    <>
      {isCurrent && <span className={styles.marker} aria-hidden />}
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <span className={styles.label}>{label}</span>
    </>
  )

  if (!href) return <span className={className}>{content}</span>

  return (
    <a href={href} className={className} aria-current={isCurrent ? 'page' : undefined}>
      {content}
    </a>
  )
}
