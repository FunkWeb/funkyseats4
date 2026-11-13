import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { UnauthorizedError } from './errors'

export const authQueryKey = ['auth', 'me'] as const

function handleGlobalError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    queryClient.setQueryData(authQueryKey, null)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(error instanceof UnauthorizedError) && failureCount < 1,
    },
  },
})
