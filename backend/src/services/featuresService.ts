import type { CreateFeatureRequest, FeatureDto } from '../../../contracts/feature.js'
import { ConflictError } from '../errors/appErrors.js'
import type { FeaturesRepository } from '../repositories/featuresRepository.js'
import { findOrThrow } from './common.js'

export interface FeaturesServiceDeps {
  features: Pick<FeaturesRepository, 'findAll' | 'findById' | 'create'>
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const createFeaturesService = ({ features }: FeaturesServiceDeps) => {
  const findById = (featureId: number): Promise<FeatureDto> =>
    findOrThrow(features.findById(featureId), 'Feature')

  const assertNameFree = async (name: string) => {
    const existing = await features.findAll()
    if (existing.some((feature) => sameName(feature.name, name)))
      throw new ConflictError(`Feature ${name} already exists`)
  }

  const create = async (input: CreateFeatureRequest): Promise<number> => {
    await assertNameFree(input.name)
    return features.create(input)
  }

  return {
    findAll: features.findAll,
    findById,
    create,
  }
}

export type FeaturesService = ReturnType<typeof createFeaturesService>
