import { RequestHandler, Router } from 'express'

export function createFeaturesRoutes(
  featuresService: unknown,
  requireAuth: RequestHandler,
  requireRole: (role: string) => RequestHandler,
) {
  const router = Router()

  router.get('/', requireAuth, async (_req, res, next) => {
    try {
      const features = await (featuresService as any).getAllFeatures()
      res.json(features)
    } catch (error) {
      next(error)
    }
  })

  router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
    try {
      const newFeature = await (featuresService as any).createFeature(req.body)
      res.status(201).json({ id: newFeature.id })
    } catch (error: unknown) {
      const err = error as { code?: string; status?: number }
      if (err.code === 'DUPLICATE' || err.status === 409) {
        return res.status(409).json({ message: 'Feature name already exist' })
      }
      next(error)
    }
  })

  return router
}
