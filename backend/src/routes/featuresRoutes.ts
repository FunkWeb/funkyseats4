import { Router, type RequestHandler } from 'express'
import { requireRole } from '../auth/requireRole.js'
import type { FeaturesService } from '../services/featuresService.js'
import { parseCreateFeature } from '../validation/featureRequests.js'

export interface FeaturesRoutesDeps {
  featuresService: Pick<FeaturesService, 'findAll' | 'create'>
  requireAuth: RequestHandler
}

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

  return router
}
