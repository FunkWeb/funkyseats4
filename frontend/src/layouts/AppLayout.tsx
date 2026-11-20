import { Outlet, useLocation } from 'react-router'
import { Button } from '../components/Button'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { UserIdentity } from '../components/UserIdentity'
import { useAuth } from '../features/auth/useAuth'
import styles from './AppLayout.module.css'

const userItems: SidebarItem[] = [
  { label: 'Rom', href: '/rooms' },
  { label: 'Mine reservasjoner', href: '/profile' },
]

const adminItem: SidebarItem = {
  label: 'Administrasjon',
  items: [
    { label: 'Rediger rom', href: '/admin/rooms' },
    { label: 'Rediger plasser i rom', href: '/admin/seats' },
    { label: 'Brukerprofiler', href: '/admin/users' },
  ],
}

function getCurrentHref(items: SidebarItem[], pathname: string) {
  return items
    .flatMap((item) => ('items' in item ? item.items : [item]))
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const { user, isAdmin, logout, isLoggingOut } = useAuth()

  if (!user) return null

  const items = isAdmin ? [...userItems, adminItem] : userItems

  return (
    <div className={styles.layout}>
      <Sidebar
        title="Funkyseats"
        items={items}
        currentHref={getCurrentHref(items, pathname)}
        className={styles.sidebar}
        footer={
          <div className={styles.footer}>
            <UserIdentity
              name={user.name}
              subtitle={user.email}
              avatarSrc={user.avatarPath ?? undefined}
              size="sm"
            />
            <Button
              variant="ghost"
              onClick={logout}
              disabled={isLoggingOut}
              className={styles.logoutButton}
            >
              Logg ut
            </Button>
          </div>
        }
      />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
