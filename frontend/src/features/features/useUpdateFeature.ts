import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FeatureCategory, UpdateFeatureRequest } from '../../../../contracts/feature'
import { ConflictError } from '../../api/errors'
import { getFeatures, updateFeature, uploadFeatureIcon } from '../../api/featuresApi'
import { featuresQueryKey } from './useFeatures'

export interface UpdateFeatureInput {
  id: number
  name: string
  category: FeatureCategory
  description: string | null
  iconPath: string | null
  iconFile: File | null
}

export function useUpdateFeature() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, UpdateFeatureInput>({
    mutationFn: async ({ id, iconFile, ...input }) => {
      const update: UpdateFeatureRequest = { ...input }
      if (iconFile) {
        const existing = await queryClient.fetchQuery({
          queryKey: featuresQueryKey,
          queryFn: getFeatures,
          staleTime: 0,
        })
        if (
          existing.some(
            (feature) =>
              feature.id !== id && feature.name.toLowerCase() === input.name.toLowerCase(),
          )
        ) {
          throw new ConflictError(`Feature ${input.name} already exists`)
        }

        update.iconPath = (await uploadFeatureIcon(iconFile)).iconPath
      }
      return updateFeature(id, update)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featuresQueryKey }),
  })
}
