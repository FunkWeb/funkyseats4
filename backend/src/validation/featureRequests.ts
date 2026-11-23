import {
  FEATURE_CATEGORIES,
  isValidIconPath,
  type CreateFeatureRequest,
  type UpdateFeatureRequest,
} from '../../../contracts/feature.js'
import { ValidationError } from '../errors/appErrors.js'
import {
  asRecord,
  parseIfPresent,
  parseNonEmptyString,
  parseOneOf,
  parseOptionalString,
} from './parsers.js'

const parseIconPath = (value: unknown): string | null => {
  const parsed = parseOptionalString(value, 'iconPath')
  if (parsed === null) {
    return null
  }
  if (!isValidIconPath(parsed)) {
    throw new ValidationError('iconPath must be an .svg file under /icons/')
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

export const parseUpdateFeature = (body: unknown): UpdateFeatureRequest => {
  const fields = asRecord(body)
  return {
    name: parseIfPresent(fields.name, (value) => parseNonEmptyString(value, 'name')),
    description: parseIfPresent(fields.description, (value) =>
      parseOptionalString(value, 'description'),
    ),
    iconPath: parseIfPresent(fields.iconPath, parseIconPath),
    category: parseIfPresent(fields.category, (value) =>
      parseOneOf(FEATURE_CATEGORIES, value, 'category'),
    ),
  }
}

export const validateSvgContent = (raw: string): string => {
  const trimmed = raw.trim()

  const withoutProlog = trimmed
    .replace(/^<\?xml[^>]*\?>\s*/i, '')
    .replace(/^(<!--[\s\S]*?-->\s*)*/, '')
    .replace(/^<!DOCTYPE[^>]*>\s*/i, '')

  if (!/^<svg[\s>]/i.test(withoutProlog) || !/<\/svg\s*>$/i.test(withoutProlog)) {
    throw new ValidationError('File must be a valid SVG with an <svg> root element')
  }

  if (/<script[\s>]/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain <script> elements')
  }

  if (/<foreignObject[\s>]/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain <foreignObject> elements')
  }

  if (/[\s/"']on[a-z]+\s*=/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain inline event handlers')
  }

  if (/&#/.test(trimmed)) {
    throw new ValidationError('SVG must not contain numeric character references')
  }

  if (/javascript\s*:/i.test(trimmed)) {
    throw new ValidationError('SVG must not contain javascript: URLs')
  }

  return trimmed
}
