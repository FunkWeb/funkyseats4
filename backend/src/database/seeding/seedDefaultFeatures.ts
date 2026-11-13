import { pathToFileURL } from 'node:url'
import type { CreateFeatureRequest } from '../../../../contracts/feature.js'
import { createDbConfig } from '../../config/createConfig.js'
import {
  createFeaturesRepository,
  type FeaturesRepository,
} from '../../repositories/featuresRepository.js'
import { createPool } from '../createPool.js'
import { defaultFeatures } from '../defaultFeatures.js'

export const seedDefaultFeatures = async (
  features: Pick<FeaturesRepository, 'existsByName' | 'create'>,
  defaults: CreateFeatureRequest[] = defaultFeatures,
) => {
  for (const feature of defaults) {
    if (await features.existsByName(feature.name)) {
      console.log(`Skipped: ${feature.name} already exists`)
      continue
    }

    await features.create(feature)
    console.log(`Seeded default feature: ${feature.name}`)
  }
}

const main = async () => {
  const db = createPool(createDbConfig(process.env))

  try {
    await seedDefaultFeatures(createFeaturesRepository(db))
  } finally {
    await db.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
