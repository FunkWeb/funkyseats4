import { QueryClient } from '@tanstack/react-query'
import { UnauthorizedError } from './httpClient'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(error instanceof UnauthorizedError) && failureCount < 1,
    },
  },
})
