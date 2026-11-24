import type {
  CreateFeatureRequest,
  FeatureDto,
  UpdateFeatureRequest,
} from '../../../contracts/feature.js'
import { ConflictError, NotFoundError } from '../errors/appErrors.js'
import type { FeaturesRepository } from '../repositories/featuresRepository.js'
import { findOrThrow } from './common.js'

export interface FeaturesServiceDeps {
  features: Pick<FeaturesRepository, 'findAll' | 'findById' | 'create' | 'update' | 'delete'>
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const createFeaturesService = ({ features }: FeaturesServiceDeps) => {
  const findById = (featureId: number): Promise<FeatureDto> =>
    findOrThrow(features.findById(featureId), 'Feature')

  const assertNameFree = async (name: string, exceptId?: number) => {
    const existing = await features.findAll()
    if (existing.some((feature) => feature.id !== exceptId && sameName(feature.name, name)))
      throw new ConflictError(`Feature ${name} already exists`)
  }

  const create = async (input: CreateFeatureRequest): Promise<number> => {
    await assertNameFree(input.name)
    return features.create(input)
  }

  const update = async (featureId: number, input: UpdateFeatureRequest): Promise<string | null> => {
    const feature = await findById(featureId)
    if (input.name !== undefined && !sameName(input.name, feature.name)) {
      await assertNameFree(input.name, featureId)
    }
    if (!(await features.update(featureId, input))) await findById(featureId)
    return feature.iconPath
  }

  const remove = async (featureId: number): Promise<string | null> => {
    const feature = await findById(featureId)
    if (!(await features.delete(featureId))) throw new NotFoundError('Feature')
    return feature.iconPath
  }

  return {
    findAll: features.findAll,
    findById,
    create,
    update,
    delete: remove,
  }
}

export type FeaturesService = ReturnType<typeof createFeaturesService>
