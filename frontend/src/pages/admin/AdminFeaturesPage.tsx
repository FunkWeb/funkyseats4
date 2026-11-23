import { useState } from 'react'
import { Button } from '../../components/Button'
import { FeatureGroup } from '../../components/FeatureGroup'
import { PlusIcon } from '../../components/icons/PlusIcon'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { SectionHeader } from '../../components/SectionHeader'
import { Spinner } from '../../components/Spinner'
import { CATEGORY_TITLES, FEATURE_CATEGORY_LIST } from '../../features/features/featureCategories'
import { FeatureFormModal } from '../../features/features/FeatureFormModal'
import { useFeatures } from '../../features/features/useFeatures'
import styles from './AdminFeaturesPage.module.css'

export default function AdminFeaturesPage() {
  const featuresQuery = useFeatures()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const features = featuresQuery.data ?? []

  return (
    <>
      <PageHeader title="Funksjoner" />

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
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
                  <FeatureGroup title="" features={categoryFeatures} />
                </div>
              )
            })}
          </div>
        ))}

      <FeatureFormModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  )
}
