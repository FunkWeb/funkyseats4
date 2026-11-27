import { Router, type RequestHandler } from 'express'
import type { FeaturesService } from '../services/featuresService.js'
import { requireRole } from '../auth/requireRole.js'
import { rawUpload } from '../middleware/rawUpload.js'
import { parseId } from '../validation/parsers.js'
import {
  parseCreateFeature,
  parseUpdateFeature,
  validateSvgContent,
} from '../validation/featureRequests.js'

export interface FeaturesRoutesDeps {
  featuresService: Pick<FeaturesService, 'findAll' | 'create' | 'update' | 'delete' | 'saveIcon'>
  requireAuth: RequestHandler
}

const uploadIcon = rawUpload({
  types: new Map([['image/svg+xml', 'svg']]),
  limit: 100 * 1024,
  tooLargeMessage: 'Uploaded icon must be 100 KB or smaller',
})

export const createFeaturesRoutes = ({ featuresService, requireAuth }: FeaturesRoutesDeps) => {
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
    await featuresService.update(parseId(req.params.id, 'id'), parseUpdateFeature(req.body))
    res.sendStatus(204)
  })

  router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    await featuresService.delete(parseId(req.params.id, 'id'))
    res.sendStatus(204)
  })

  router.post('/icons', requireRole('ADMIN'), ...uploadIcon, (async (req, res) => {
    const content = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : ''
    const iconPath = await featuresService.saveIcon(validateSvgContent(content))
    res.status(201).json({ iconPath })
  }) satisfies RequestHandler)

  return router
}
