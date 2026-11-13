import { FEATURE_CATEGORIES, type CreateFeatureRequest } from '../../../contracts/feature.js'
import { ValidationError } from '../errors/appErrors.js'
import { asRecord, parseNonEmptyString, parseOneOf, parseOptionalString } from './parsers.js'

const ALLOWED_ICON_PREFIXES = ['/icons/', '/api/uploads/icons/']

const parseIconPath = (value: unknown): string | null => {
  const parsed = parseOptionalString(value, 'iconPath')
  if (parsed === null) {
    return null
  }
  const hasValidPrefix = ALLOWED_ICON_PREFIXES.some((prefix) => parsed.startsWith(prefix))
  if (!hasValidPrefix || parsed.includes('..')) {
    throw new ValidationError('iconPath must start with /icons/ or /api/uploads/icons/')
  }
  return parsed
}

export const parseCreateFeature = (body: unknown): CreateFeatureRequest => {
  const { name, description, iconPath, category } = asRecord(body)
  return {
    name: parseNonEmptyString(name, 'name'),
    description: parseOptionalString(description, 'description'),
    iconPath: parseIconPath(iconPath),
    category: parseOneOf(FEATURE_CATEGORIES, category, 'category'),
  }
}

export const validateSvgContent = (raw: string): string => {
  const trimmed = raw.trim()

  if (!/<svg[\s>]/i.test(trimmed) || !/<\/svg\s*>/i.test(trimmed)) {
    throw new ValidationError('File must be a valid SVG with an <svg> root element')
  }

  if (/<script[\s>]/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain <script> elements')
  }

  if (/<foreignObject[\s>]/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain <foreignObject> elements')
  }

  if (/\son[a-z]+\s*=/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain inline event handlers')
  }

  if (/javascript\s*:/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain javascript: URLs')
  }

  return trimmed
}
