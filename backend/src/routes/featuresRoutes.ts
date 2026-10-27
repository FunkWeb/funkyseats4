import { Router } from 'express'

export function createFeaturesRoutes(featuresService: any, requireAuth: any, requireRole: any) {
  const router = Router()

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const features = await featuresService.getAllFeatures()
      res.json(features)
    } catch (error) {
      next(error)
    }
  })

  router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
    try {
      const newFeature = await featuresService.createFeature(req.body)
      res.status(201).json({ id: newFeature.id })
    } catch (error: any) {
      if (error.code == 'DUPLICATE' || error.status == 409) {
        return res.status(409).json({ message: 'Feature name already exist' })
      }
      next(error)
    }
  })

  return router
}
