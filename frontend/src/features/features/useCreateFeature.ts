import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FeatureCategory } from '../../../../contracts/feature'
import { createFeature, uploadFeatureIcon } from '../../api/featuresApi'
import { featuresQueryKey } from './useFeatures'

export interface CreateFeatureInput {
  name: string
  category: FeatureCategory
  description: string | null
  iconFile: File | null
}

export function useCreateFeature() {
  const queryClient = useQueryClient()

  return useMutation<{ id: number }, Error, CreateFeatureInput>({
    mutationFn: async ({ name, category, description, iconFile }) => {
      let iconPath: string | null = null

      if (iconFile) {
        const uploaded = await uploadFeatureIcon(iconFile)
        iconPath = uploaded.iconPath
      }

      return createFeature({
        name,
        category,
        description,
        iconPath,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: featuresQueryKey })
    },
  })
}
