import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import type { FeaturesService } from '../services/featuresService.js'
import { requireRole } from '../auth/requireRole.js'
import { PayloadTooLargeError, UnsupportedMediaTypeError } from '../errors/appErrors.js'
import { isEntityTooLarge } from '../errors/errorHandler.js'
import { parseId } from '../validation/parsers.js'
import {
  parseCreateFeature,
  parseUpdateFeature,
  validateSvgContent,
} from '../validation/featureRequests.js'

export interface FeaturesRoutesDeps {
  featuresService: Pick<FeaturesService, 'findAll' | 'create' | 'update' | 'delete'>
  requireAuth: RequestHandler
  uploadsDir: string
}

const MAX_ICON_BYTES = 100 * 1024
const UPLOADED_ICON_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.svg$/i

const isMissingPath = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

const removeUploadedIcon = async (uploadsDir: string, iconPath: string | null) => {
  if (!iconPath) return
  const filename = path.basename(iconPath)
  if (!UPLOADED_ICON_PATTERN.test(filename)) return

  const iconsDir = path.resolve(uploadsDir, 'icons')
  const shippedIconsDir = path.resolve(process.cwd(), 'backend', 'assets', 'icons')
  if (iconsDir.toLowerCase() === shippedIconsDir.toLowerCase()) return

  let realIconsDir: string
  try {
    realIconsDir = await fs.realpath(iconsDir)
  } catch (error) {
    if (isMissingPath(error)) return
    throw error
  }

  let realShippedIconsDir = shippedIconsDir
  try {
    realShippedIconsDir = await fs.realpath(shippedIconsDir)
  } catch (error) {
    if (!isMissingPath(error)) throw error
  }
  if (realIconsDir.toLowerCase() === realShippedIconsDir.toLowerCase()) return

  await fs.rm(path.join(realIconsDir, filename), { force: true })
}

const requireSvgContentType: RequestHandler = (req, _res, next) => {
  if (!req.is('image/svg+xml')) {
    next(new UnsupportedMediaTypeError('Content-Type must be image/svg+xml'))
    return
  }
  next()
}

const iconTooLarge: ErrorRequestHandler = (error, _req, _res, next) => {
  if (isEntityTooLarge(error)) {
    next(new PayloadTooLargeError('Uploaded icon must be 100 KB or smaller'))
    return
  }
  next(error)
}

export const createFeaturesRoutes = ({
  featuresService,
  requireAuth,
  uploadsDir,
}: FeaturesRoutesDeps) => {
  const router = Router()
  router.use(requireAuth)

  router.get('/', async (_req, res) => {
    res.json(await featuresService.findAll())
  })

  router.post('/', requireRole('ADMIN'), async (req, res) => {
    const id = await featuresService.create(parseCreateFeature(req.body))
    res.status(201).json({ id })
  })

  router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
    const featureId = parseId(req.params.id, 'id')
    const oldIconPath = await featuresService.update(featureId, parseUpdateFeature(req.body))
    if (req.body?.iconPath !== undefined && req.body.iconPath !== oldIconPath) {
      await removeUploadedIcon(uploadsDir, oldIconPath)
    }
    res.sendStatus(204)
  })

  router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    const oldIconPath = await featuresService.delete(parseId(req.params.id, 'id'))
    await removeUploadedIcon(uploadsDir, oldIconPath)
    res.sendStatus(204)
  })

  router.post(
    '/icons',
    requireRole('ADMIN'),
    requireSvgContentType,
    express.raw({ type: 'image/svg+xml', limit: MAX_ICON_BYTES }),
    iconTooLarge,
    (async (req, res) => {
      const content = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : ''
      const validSvg = validateSvgContent(content)

      const iconsDir = path.join(uploadsDir, 'icons')
      await fs.mkdir(iconsDir, { recursive: true })

      const filename = `${crypto.randomUUID()}.svg`
      await fs.writeFile(path.join(iconsDir, filename), validSvg, 'utf8')

      res.status(201).json({ iconPath: `/icons/${filename}` })
    }) satisfies RequestHandler,
  )

  return router
}
