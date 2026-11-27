import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { USER_ROLES } from '../../../../contracts/user'
import { devLogin, isDevLoginEnabled } from '../../api/authApi'
import { authQueryKey } from '../../api/queryClient'
import { Button } from '../../components/Button'
import styles from './DevLoginButtons.module.css'

export function DevLoginButtons() {
  const queryClient = useQueryClient()
  const { data: isEnabled } = useQuery({
    queryKey: ['auth', 'dev-login'],
    queryFn: isDevLoginEnabled,
    staleTime: Infinity,
  })
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: devLogin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authQueryKey }),
  })

  if (!isEnabled) return null

  return (
    <div className={styles.devLogin}>
      <p className={styles.label}>Utviklerinnlogging</p>
      <div className={styles.buttons}>
        {USER_ROLES.map((role) => (
          <Button
            key={role}
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => mutate(role)}
          >
            {role}
          </Button>
        ))}
      </div>
      {isError && <p className={styles.error}>{error.message}</p>}
    </div>
  )
}
