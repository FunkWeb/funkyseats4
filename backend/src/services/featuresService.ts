import type {
  CreateFeatureRequest,
  FeatureDto,
  UpdateFeatureRequest,
} from '../../../contracts/feature.js'
import { ConflictError, NotFoundError } from '../errors/appErrors.js'
import type { FeaturesRepository } from '../repositories/featuresRepository.js'
import type { UploadStorage } from '../storage/uploadStorage.js'
import { findOrThrow, removeUnusedUpload } from './common.js'

export interface FeaturesServiceDeps {
  features: Pick<
    FeaturesRepository,
    'findAll' | 'findById' | 'existsByIconPath' | 'create' | 'update' | 'delete'
  >
  iconStorage: Pick<UploadStorage, 'save' | 'remove'>
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const createFeaturesService = ({ features, iconStorage }: FeaturesServiceDeps) => {
  const findById = (featureId: number): Promise<FeatureDto> =>
    findOrThrow(features.findById(featureId), 'Feature')

  const assertNameFree = async (name: string, exceptId?: number) => {
    const existing = await features.findAll()
    if (existing.some((feature) => feature.id !== exceptId && sameName(feature.name, name)))
      throw new ConflictError(`Feature ${name} already exists`)
  }

  const removeIconIfUnused = (iconPath: string | null) =>
    removeUnusedUpload(iconStorage, iconPath, features.existsByIconPath)

  const create = async (input: CreateFeatureRequest): Promise<number> => {
    await assertNameFree(input.name)
    return features.create(input)
  }

  const update = async (featureId: number, input: UpdateFeatureRequest): Promise<void> => {
    const feature = await findById(featureId)
    if (input.name !== undefined && !sameName(input.name, feature.name)) {
      await assertNameFree(input.name, featureId)
    }
    if (!(await features.update(featureId, input))) await findById(featureId)
    if (input.iconPath !== undefined && input.iconPath !== feature.iconPath) {
      await removeIconIfUnused(feature.iconPath)
    }
  }

  const remove = async (featureId: number): Promise<void> => {
    const feature = await findById(featureId)
    if (!(await features.delete(featureId))) throw new NotFoundError('Feature')
    await removeIconIfUnused(feature.iconPath)
  }

  const saveIcon = (svg: string): Promise<string> => iconStorage.save(svg, 'svg')

  return {
    findAll: features.findAll,
    findById,
    create,
    update,
    delete: remove,
    saveIcon,
  }
}

export type FeaturesService = ReturnType<typeof createFeaturesService>
