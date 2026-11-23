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

export const ICON_PATH_PATTERN = /^\/icons\/[A-Za-z0-9_-]+\.svg$/

export const isValidIconPath = (value: string): boolean => ICON_PATH_PATTERN.test(value)
