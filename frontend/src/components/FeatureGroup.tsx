import type { FeatureDto } from '../../../contracts/feature'
import { FeatureTile } from './FeatureTile'
import styles from './FeatureGroup.module.css'

export interface FeatureGroupProps {
  title: string
  features: FeatureDto[]
  className?: string
}

export function FeatureGroup({ title, features, className }: FeatureGroupProps) {
  const containerClassName = [styles.group, className].filter(Boolean).join(' ')

  if (!features || features.length === 0) {
    return null
  }

  return (
    <section className={containerClassName}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {features.map((feature) => (
          <FeatureTile key={feature.id ?? feature.name} feature={feature} />
        ))}
      </div>
    </section>
  )
}
