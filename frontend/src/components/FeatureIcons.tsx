import { useState } from 'react'
import type { FeatureDto } from '../../../contracts/feature'
import { classNames } from '../utils/classNames'
import styles from './FeatureIcons.module.css'
import { StarIcon } from './icons/StarIcon'

export interface FeatureIconsProps {
  features: Pick<FeatureDto, 'id' | 'name' | 'iconPath'>[]
  hideLabels?: boolean
  className?: string
}

function FeatureIcon({ iconPath }: { iconPath: string | null }) {
  const [hasImageError, setHasImageError] = useState(false)

  if (iconPath && !hasImageError) {
    return (
      <img className={styles.icon} src={iconPath} alt="" onError={() => setHasImageError(true)} />
    )
  }

  return (
    <span className={classNames(styles.icon, styles.fallbackIcon)}>
      <StarIcon />
    </span>
  )
}

export function FeatureIcons({ features, hideLabels = false, className }: FeatureIconsProps) {
  if (features.length === 0) {
    return null
  }

  return (
    <ul
      className={classNames(styles.list, hideLabels && styles.hideLabels, className)}
      aria-label="Features"
    >
      {features.map((feature) => (
        <li className={styles.feature} key={`${feature.id}:${feature.iconPath ?? ''}`}>
          <FeatureIcon iconPath={feature.iconPath} />
          <span className={styles.label}>{feature.name}</span>
        </li>
      ))}
    </ul>
  )
}
