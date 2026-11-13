import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import { NavGroup, type NavGroupProps, type NavLink } from './NavGroup'
import { NavItem } from './NavItem'
import styles from './Sidebar.module.css'

export type SidebarGroup = Omit<NavGroupProps, 'currentHref'>
export type SidebarItem = NavLink | SidebarGroup

export interface SidebarProps {
  items: SidebarItem[]
  currentHref?: string
  title?: string
  footer?: ReactNode
  'aria-label'?: string
  className?: string
}

const isGroup = (item: SidebarItem): item is SidebarGroup => 'items' in item

export function Sidebar({
  items,
  currentHref,
  title,
  footer,
  'aria-label': ariaLabel = 'Hovednavigasjon',
  className,
}: SidebarProps) {
  return (
    <aside className={classNames(styles.sidebar, className)}>
      {title && <div className={styles.title}>{title}</div>}
      <nav className={styles.nav} aria-label={ariaLabel}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={isGroup(item) ? item.label : item.href}>
              {isGroup(item) ? (
                <NavGroup {...item} currentHref={currentHref} />
              ) : (
                <NavItem {...item} isCurrent={item.href === currentHref} />
              )}
            </li>
          ))}
        </ul>
      </nav>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  )
}
