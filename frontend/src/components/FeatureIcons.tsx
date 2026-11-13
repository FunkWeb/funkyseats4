import { useState, type CSSProperties } from 'react'
import type { FeatureDto } from '../../../contracts/feature'
import { classNames } from '../utils/classNames'
import styles from './FeatureIcons.module.css'
import { StarIcon } from './icons/StarIcon'

export interface FeatureIconsProps {
  features: Pick<FeatureDto, 'id' | 'name' | 'iconPath'>[]
  hideLabels?: boolean
  className?: string
}

export function FeatureIcon({ iconPath }: { iconPath: string | null }) {
  const [failedIconPath, setFailedIconPath] = useState<string | null>(null)

  if (iconPath && failedIconPath !== iconPath) {
    return (
      <>
        <span
          className={classNames(styles.icon, styles.maskIcon)}
          style={{ '--icon-url': `url(${JSON.stringify(iconPath)})` } as CSSProperties}
        />
        <img
          className={styles.loadProbe}
          src={iconPath}
          alt=""
          onError={() => setFailedIconPath(iconPath)}
        />
      </>
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
        <li
          className={styles.feature}
          key={`${feature.id}:${feature.iconPath ?? ''}`}
          tabIndex={hideLabels ? 0 : undefined}
        >
          <FeatureIcon iconPath={feature.iconPath} />
          <span className={styles.label}>{feature.name}</span>
        </li>
      ))}
    </ul>
  )
}
