import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { USER_ROLES, type UserDto, type UserRole } from '../../../../contracts/user'
import { getUsers, updateUserRole } from '../../api/usersApi'
import { Button } from '../../components/Button'
import { DataTable, type Column } from '../../components/DataTable'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { Select } from '../../components/Select'
import { UserIdentity } from '../../components/UserIdentity'
import { useAuth } from '../../features/auth/useAuth'
import { errorMessage } from '../../utils/errorMessage'
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

interface PendingRoleChange {
  user: UserDto
  role: UserRole
}

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
  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => updateUserRole(id, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  function closeConfirm() {
    updateRoleMutation.reset()
    setPendingChange(null)
  }

  function confirmRoleChange() {
    if (!pendingChange) return
    updateRoleMutation.mutate(
      { id: pendingChange.user.id, role: pendingChange.role },
      { onSuccess: closeConfirm },
    )
  }

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

        {usersQuery.isError ? (
          <Notice
            variant="danger"
            title="Kunne ikke hente brukere"
            description="Prøv igjen senere."
          />
        ) : (
          <DataTable
            columns={columns}
            data={usersQuery.data?.items ?? []}
            getRowKey={(row) => String(row.id)}
            isLoading={usersQuery.isPending}
            emptyMessage="Ingen brukere funnet."
          />
        )}
      </section>

      <Modal
        open={pendingChange !== null}
        title="Endre rolle?"
        onClose={closeConfirm}
        footer={
          <>
            <Button disabled={updateRoleMutation.isPending} onClick={confirmRoleChange}>
              {updateRoleMutation.isPending ? 'Lagrer…' : 'Endre rolle'}
            </Button>
            <Button
              variant="outline"
              disabled={updateRoleMutation.isPending}
              onClick={closeConfirm}
            >
              Avbryt
            </Button>
          </>
        }
      >
        {pendingChange && (
          <p>
            Er du sikker på at du vil endre rollen til <strong>{pendingChange.user.name}</strong>{' '}
            fra <strong>{ROLE_LABELS[pendingChange.user.role]}</strong> til{' '}
            <strong>{ROLE_LABELS[pendingChange.role]}</strong>?
          </p>
        )}
        {updateRoleMutation.isError && (
          <Notice
            variant="danger"
            title="Kunne ikke endre rolle"
            description={errorMessage(
              updateRoleMutation.error,
              'Kunne ikke oppdatere brukerrollen. Prøv igjen.',
            )}
          />
        )}
      </Modal>
    </>
  )
}
