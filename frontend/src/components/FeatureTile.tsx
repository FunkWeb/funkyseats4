import type { ReactNode } from 'react'
import { Card } from './Card'
import type { FeatureDto } from '../../../contracts/feature'
import styles from './FeatureTile.module.css'

export type ExtendedFeatureDto = FeatureDto & {
  icon?: ReactNode
}

export interface FeatureTileProps {
  feature: ExtendedFeatureDto
  className?: string
}

export function FeatureTile({ feature, className }: FeatureTileProps) {
  const containerClassName = [styles.tile, className].filter(Boolean).join(' ')
  const featureIcon = (feature as { icon?: ReactNode }).icon

  return (
    <Card className={containerClassName}>
      {featureIcon && (
        <span className={styles.icon} aria-hidden="true">
          {featureIcon}
        </span>
      )}
      <div className={styles.content}>
        <span className={styles.name}>{feature.name}</span>
        {feature.description && <span className={styles.description}>{feature.description}</span>}
      </div>
    </Card>
  )
}
