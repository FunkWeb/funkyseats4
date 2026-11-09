import { useId, useState, type ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import { ChevronIcon } from './icons/ChevronIcon'
import styles from './NavGroup.module.css'
import { NavItem } from './NavItem'

export interface NavLink {
  label: string
  href: string
  icon?: ReactNode
}

export interface NavGroupProps {
  label: string
  items: NavLink[]
  icon?: ReactNode
  defaultOpen?: boolean
  currentHref?: string
}

export function NavGroup({ label, items, icon, defaultOpen, currentHref }: NavGroupProps) {
  const containsCurrent: boolean = items.some((item) => item.href === currentHref)
  const [open, setOpen] = useState(defaultOpen ?? containsCurrent)
  const listId = useId()

  return (
    <div className={styles.navGroup}>
      <button
        type="button"
        className={classNames(styles.toggle, containsCurrent && styles.active)}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        {icon && (
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
        )}
        <span className={styles.label}>{label}</span>
        <span className={classNames(styles.chevron, open && styles.open)} aria-hidden>
          <ChevronIcon direction="right" />
        </span>
      </button>
      <ul id={listId} className={styles.list} hidden={!open}>
        {items.map((item) => (
          <li key={item.href}>
            <NavItem {...item} isNested isCurrent={item.href === currentHref} />
          </li>
        ))}
      </ul>
    </div>
  )
}
