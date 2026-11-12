import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, logout as logoutRequest } from '../../api/authApi'
import { authQueryKey } from '../../api/queryClient'

export { authQueryKey }

type UserDto = NonNullable<Awaited<ReturnType<typeof getMe>>>

export interface UseAuthResult {
  user: UserDto | null | undefined
  isPending: boolean
  isError: boolean
  isAdmin: boolean
  logout: () => void
  isLoggingOut: boolean
}

export function useAuth(): UseAuthResult {
  const queryClient = useQueryClient()

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: authQueryKey,
    queryFn: getMe,
    staleTime: Infinity,
  })

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null)
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] !== authQueryKey[0] || query.queryKey[1] !== authQueryKey[1],
      })
    },
  })

  return {
    user,
    isPending,
    isError,
    isAdmin: user?.role === 'ADMIN',
    logout: () => logout(),
    isLoggingOut,
  }
}
