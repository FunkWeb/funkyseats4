export const FEATURE_CATEGORIES = ['OS', 'SOFTWARE', 'HARDWARE', 'OTHER'] as const

export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number]

export interface FeatureDto {
  id: number
  name: string
  description: string | null
  iconPath: string | null
  category: FeatureCategory
}

export type CreateFeatureRequest = Omit<FeatureDto, 'id'>
