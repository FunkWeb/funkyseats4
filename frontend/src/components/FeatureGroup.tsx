import type { ExtendedFeatureDto } from './FeatureTile'
import { FeatureTile } from './FeatureTile'
import { classNames } from '../utils/classNames'
import styles from './FeatureGroup.module.css'

export interface FeatureGroupProps {
  title: string
  features: ExtendedFeatureDto[]
  selectedIds?: number[]
  onToggle?: (feature: ExtendedFeatureDto) => void
  className?: string
}

export function FeatureGroup({
  title,
  features,
  selectedIds = [],
  onToggle,
  className,
}: FeatureGroupProps) {
  if (features.length === 0) {
    return null
  }

  return (
    <section className={classNames(styles.group, className)}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {features.map((feature) => (
          <FeatureTile
            key={feature.id}
            feature={feature}
            selected={selectedIds.includes(feature.id)}
            onClick={onToggle}
          />
        ))}
      </div>
    </section>
  )
}
