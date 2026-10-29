import { FEATURE_CATEGORIES, type CreateFeatureRequest } from '../../../contracts/feature.js'
import { asRecord, parseNonEmptyString, parseOneOf, parseOptionalString } from './parsers.js'

export const parseCreateFeature = (body: unknown): CreateFeatureRequest => {
  const { name, description, iconPath, category } = asRecord(body)
  return {
    name: parseNonEmptyString(name, 'name'),
    description: parseOptionalString(description, 'description'),
    iconPath: parseOptionalString(iconPath, 'iconPath'),
    category: parseOneOf(FEATURE_CATEGORIES, category, 'category'),
  }
}
