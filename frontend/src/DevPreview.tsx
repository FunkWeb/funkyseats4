import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { FeatureDto } from '../../contracts/feature'
import { defaultFeatures } from '../../backend/src/database/defaultFeatures'
import { FeatureGroup } from './components/FeatureGroup'
import { FeatureIcons } from './components/FeatureIcons'
import './styles/index.css'

const defaultFeaturesForPreview: FeatureDto[] = defaultFeatures.map((feature, index) => ({
  ...feature,
  id: index + 1,
}))
const features: FeatureDto[] = [
  ...defaultFeaturesForPreview,
  {
    id: defaultFeaturesForPreview.length + 1,
    name: 'Feature without an icon',
    description: null,
    iconPath: null,
    category: 'OTHER',
  },
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h1>Feature icon preview</h1>
      <FeatureGroup title="Feature tiles" features={features} />
      <h2>Feature icons</h2>
      <FeatureIcons features={features} />
    </main>
  </StrictMode>,
)
