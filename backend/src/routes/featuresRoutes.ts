import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import type { FeaturesService } from '../services/featuresService.js'
import { requireRole } from '../auth/requireRole.js'
import { PayloadTooLargeError, UnsupportedMediaTypeError } from '../errors/appErrors.js'
import { isEntityTooLarge } from '../errors/errorHandler.js'
import { parseCreateFeature, validateSvgContent } from '../validation/featureRequests.js'

export interface FeaturesRoutesDeps {
  featuresService: Pick<FeaturesService, 'findAll' | 'create'>
  requireAuth: RequestHandler
  uploadsDir: string
}

const MAX_ICON_BYTES = 100 * 1024

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
