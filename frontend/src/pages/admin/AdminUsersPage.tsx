import { useState } from 'react'
import type { UserDto, UserRole } from '../../../../contracts/user'
import { DataTable, type Column } from '../../components/DataTable'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { Select } from '../../components/Select'
import { UserIdentity } from '../../components/UserIdentity'
import { useAuth } from '../../features/auth/useAuth'
import { ChangeRoleModal, type PendingRoleChange } from '../../features/users/ChangeRoleModal'
import { ROLE_OPTIONS } from '../../features/users/roleLabels'
import { useUsers } from '../../features/users/useUsers'
import styles from './AdminUsersPage.module.css'

function formatLastLogin(lastLoginAt: string | null): string {
  if (!lastLoginAt) {
    return '–'
  }
  return new Date(lastLoginAt).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { data, isPending, isError } = useUsers()
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null)

  const columns: Column<UserDto>[] = [
    {
      key: 'user',
      header: 'Bruker',
      render: (row) => (
        <UserIdentity
          name={row.name}
          subtitle={row.email}
          avatarSrc={row.avatarPath ?? undefined}
        />
      ),
    },
    {
      key: 'role',
      header: 'Rolle',
      render: (row) => (
        <Select
          className={styles.roleSelect}
          label={`Rolle for ${row.name}`}
          options={ROLE_OPTIONS}
          value={row.role}
          disabled={currentUser?.id === row.id}
          onChange={(value) => {
            const nextRole = value as UserRole
            if (nextRole !== row.role) {
              setPendingChange({ user: row, role: nextRole })
            }
          }}
        />
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Sist innlogget',
      render: (row) => formatLastLogin(row.lastLoginAt),
    },
  ]

  return (
    <>
      <PageHeader title="Admin panel" />

      <section className={styles.section} aria-label="Brukere">
        <SectionHeader title="Brukere" />

        {isError ? (
          <Notice
            variant="danger"
            title="Kunne ikke hente brukere"
            description="Prøv igjen senere."
          />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            getRowKey={(row) => String(row.id)}
            isLoading={isPending}
            emptyMessage="Ingen brukere funnet."
          />
        )}
      </section>

      <ChangeRoleModal change={pendingChange} onClose={() => setPendingChange(null)} />
    </>
  )
}
