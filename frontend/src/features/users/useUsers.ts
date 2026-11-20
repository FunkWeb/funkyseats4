import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserRole } from '../../../../contracts/user'
import { getUsers, updateUserRole } from '../../api/usersApi'

export const usersQueryKey = ['users'] as const

export interface UpdateUserRoleVariables {
  id: number
  role: UserRole
}

export function useUsers() {
  return useQuery({ queryKey: usersQueryKey, queryFn: getUsers })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, role }: UpdateUserRoleVariables) => updateUserRole(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  })
}
