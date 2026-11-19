import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { USER_ROLES, type UserDto, type UserRole } from '../../../../contracts/user'
import { getUsers, updateUserRole } from '../../api/usersApi'
import { DataTable, type Column } from '../../components/DataTable'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { Select } from '../../components/Select'
import { UserIdentity } from '../../components/UserIdentity'
import { useAuth } from '../../features/auth/useAuth'
import styles from './AdminUsersPage.module.css'

const ROLE_LABELS: Record<UserRole, string> = {
  CANDIDATE: 'Kandidat',
  SUPERVISOR: 'Veileder',
  ADMIN: 'Administrator',
}

const ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}))

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
  const queryClient = useQueryClient()
  const [roleError, setRoleError] = useState<string | null>(null)
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => updateUserRole(id, { role }),
    onMutate: ({ id }) => {
      setRoleError(null)
      setPendingUserId(id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => {
      setRoleError('Kunne ikke oppdatere brukerrollen. Prøv igjen.')
    },
    onSettled: () => {
      setPendingUserId(null)
    },
  })

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
      render: (row) => {
        const isSelf = currentUser?.id === row.id
        const isUpdating = updateRoleMutation.isPending && pendingUserId === row.id

        return (
          <Select
            className={styles.roleSelect}
            label={`Rolle for ${row.name}`}
            options={ROLE_OPTIONS}
            value={row.role}
            disabled={isSelf || isUpdating}
            onChange={(value) => {
              const nextRole = value as UserRole
              if (nextRole !== row.role) {
                updateRoleMutation.mutate({ id: row.id, role: nextRole })
              }
            }}
          />
        )
      },
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

        {roleError && (
          <Notice variant="danger" title="Kunne ikke endre rolle" description={roleError} />
        )}

        {usersQuery.isError ? (
          <Notice
            variant="danger"
            title="Kunne ikke hente brukere"
            description="Prøv igjen senere."
          />
        ) : (
          <DataTable
            columns={columns}
            data={usersQuery.data ?? []}
            getRowKey={(row) => String(row.id)}
            isLoading={usersQuery.isPending}
            emptyMessage="Ingen brukere funnet."
          />
        )}
      </section>
    </>
  )
}
