import type { ReactNode } from 'react'
import { Sidebar, type SidebarProps } from './Sidebar'
import styles from './AppShell.module.css'

export interface AppShellProps extends SidebarProps {
  children: ReactNode
}

export function AppShell({ children, ...sidebarProps }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar {...sidebarProps} />
      <main className={styles.content}>{children}</main>
    </div>
  )
}
