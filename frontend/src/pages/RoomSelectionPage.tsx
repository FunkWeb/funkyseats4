import { useLocation } from 'react-router'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import type { SidebarItem } from '../components/Sidebar'
import { UserIdentity } from '../components/UserIdentity'
import { useAuth } from '../features/auth/useAuth'
import styles from './RoomSelectionPage.module.css'

const placeholderRooms = ['Rom 1', 'Rom 2', 'Rom 3']

const navItems: SidebarItem[] = [
  { label: 'Rom', href: '/rooms' },
  { label: 'Profil', href: '/profile' },
]

const adminNavItems: SidebarItem[] = [
  {
    label: 'Admin',
    items: [
      { label: 'Rom', href: '/admin/rooms' },
      { label: 'Plasser', href: '/admin/seats' },
      { label: 'Plasstyper', href: '/admin/seat-types' },
      { label: 'Brukere', href: '/admin/users' },
    ],
  },
]

export default function RoomSelectionPage() {
  const { user, isAdmin, logout, isLoggingOut } = useAuth()
  const { pathname } = useLocation()

  const footer = user && (
    <div className={styles.footer}>
      <UserIdentity name={user.name} size="sm" />
      <Button variant="outline" size="sm" onClick={logout} disabled={isLoggingOut}>
        Logg ut
      </Button>
    </div>
  )

  return (
    <AppShell
      title="FunkySeats"
      items={isAdmin ? [...navItems, ...adminNavItems] : navItems}
      currentHref={pathname}
      footer={footer}
    >
      <PageHeader title="Velg rom" />
      <ul className={styles.list}>
        {placeholderRooms.map((room) => (
          <li key={room}>
            <Card className={styles.room}>{room}</Card>
          </li>
        ))}
      </ul>
    </AppShell>
  )
}
