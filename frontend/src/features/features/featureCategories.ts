import { FEATURE_CATEGORIES, type FeatureCategory } from '../../../../contracts/feature'

export const FEATURE_CATEGORY_LIST = FEATURE_CATEGORIES

export const CATEGORY_TITLES: Record<FeatureCategory, string> = {
  OS: 'Operativsystem',
  SOFTWARE: 'Programvare',
  HARDWARE: 'Maskinvare',
  OTHER: 'Annet',
}
