import type { UserDto, UserRole } from '../../../../contracts/user'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { errorMessage } from '../../utils/errorMessage'
import { ROLE_LABELS } from './roleLabels'
import { useUpdateUserRole } from './useUsers'

export interface PendingRoleChange {
  user: UserDto
  role: UserRole
}

export interface ChangeRoleModalProps {
  change: PendingRoleChange | null
  onClose: () => void
}

export function ChangeRoleModal({ change, onClose }: ChangeRoleModalProps) {
  const updateRoleMutation = useUpdateUserRole()

  function handleClose() {
    updateRoleMutation.reset()
    onClose()
  }

  function handleConfirm() {
    if (!change) return
    updateRoleMutation.mutate({ id: change.user.id, role: change.role }, { onSuccess: handleClose })
  }

  return (
    <Modal
      open={change !== null}
      title="Endre rolle?"
      onClose={handleClose}
      footer={
        <>
          <Button disabled={updateRoleMutation.isPending} onClick={handleConfirm}>
            {updateRoleMutation.isPending ? 'Lagrer…' : 'Endre rolle'}
          </Button>
          <Button variant="outline" disabled={updateRoleMutation.isPending} onClick={handleClose}>
            Avbryt
          </Button>
        </>
      }
    >
      {change && (
        <p>
          Er du sikker på at du vil endre rollen til <strong>{change.user.name}</strong> fra{' '}
          <strong>{ROLE_LABELS[change.user.role]}</strong> til{' '}
          <strong>{ROLE_LABELS[change.role]}</strong>?
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
  )
}
