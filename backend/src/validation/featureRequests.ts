import { FEATURE_CATEGORIES, type CreateFeatureRequest } from '../../../contracts/feature.js'
import { ValidationError } from '../errors/appErrors.js'
import { asRecord, parseNonEmptyString, parseOneOf, parseOptionalString } from './parsers.js'

const ICON_PATH_PATTERN = /^\/icons\/[A-Za-z0-9_-]+\.svg$/

const parseIconPath = (value: unknown): string | null => {
  const parsed = parseOptionalString(value, 'iconPath')
  if (parsed === null) {
    return null
  }
  if (!ICON_PATH_PATTERN.test(parsed)) {
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
