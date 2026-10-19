export type FeatureCategory = 'OS' | 'SOFTWARE' | 'HARDWARE' | 'OTHER'

export interface FeatureDto {
  id: number
  name: string
  description: string | null
  iconPath: string | null
  category: FeatureCategory
}

export type CreateFeatureRequest = Omit<FeatureDto, 'id'>
