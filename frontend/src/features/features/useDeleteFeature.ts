import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteFeature } from '../../api/featuresApi'
import { featuresQueryKey } from './useFeatures'

export function useDeleteFeature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFeature,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featuresQueryKey }),
  })
}
