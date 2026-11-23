import { useState } from 'react'
import type { FeatureDto } from '../../../../contracts/feature'
import { Button } from '../../components/Button'
import { FeatureTile } from '../../components/FeatureTile'
import { IconButton } from '../../components/IconButton'
import { PlusIcon } from '../../components/icons/PlusIcon'
import { TrashIcon } from '../../components/icons/TrashIcon'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { Spinner } from '../../components/Spinner'
import { CATEGORY_TITLES, FEATURE_CATEGORY_LIST } from '../../features/features/featureCategories'
import { DeleteFeatureModal } from '../../features/features/DeleteFeatureModal'
import { FeatureFormModal } from '../../features/features/FeatureFormModal'
import type { FeatureFormMode } from '../../features/features/FeatureFormModal'
import { useFeatures } from '../../features/features/useFeatures'
import styles from './AdminFeaturesPage.module.css'

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m14.5 6 3.5 3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function AdminFeaturesPage() {
  const featuresQuery = useFeatures()
  const [formMode, setFormMode] = useState<FeatureFormMode | null>(null)
  const [deletingFeature, setDeletingFeature] = useState<FeatureDto | null>(null)

  const features = featuresQuery.data ?? []

  return (
    <>
      <PageHeader title="Funksjoner" />

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => setFormMode({ type: 'create' })}>
          <PlusIcon />
          Legg til funksjon
        </Button>
      </div>

      {featuresQuery.isPending && <Spinner label="Laster funksjoner" />}

      {featuresQuery.isError && (
        <Notice
          variant="danger"
          title="Kunne ikke hente funksjoner"
          description="Prøv igjen senere."
        />
      )}

      {featuresQuery.isSuccess &&
        (features.length === 0 ? (
          <Notice
            title="Ingen funksjoner"
            description="Det er ikke lagt til noen funksjoner ennå."
          />
        ) : (
          <div className={styles.groups}>
            {FEATURE_CATEGORY_LIST.map((category) => {
              const categoryFeatures = features.filter((feature) => feature.category === category)
              if (categoryFeatures.length === 0) return null

              return (
                <div key={category} className={styles.categorySection}>
                  <SectionHeader title={CATEGORY_TITLES[category]} />
                  <div className={styles.featureGrid}>
                    {categoryFeatures.map((feature) => (
                      <div key={feature.id} className={styles.featureItem}>
                        <FeatureTile feature={feature} />
                        <div className={styles.featureActions}>
                          <IconButton
                            icon={<EditIcon />}
                            variant="ghost"
                            aria-label={`Rediger funksjon ${feature.name}`}
                            onClick={() => setFormMode({ type: 'edit', feature })}
                          />
                          <IconButton
                            icon={<TrashIcon />}
                            variant="danger"
                            aria-label={`Slett funksjon ${feature.name}`}
                            onClick={() => setDeletingFeature(feature)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      <FeatureFormModal mode={formMode} onClose={() => setFormMode(null)} />
      <DeleteFeatureModal feature={deletingFeature} onClose={() => setDeletingFeature(null)} />
    </>
  )
}
