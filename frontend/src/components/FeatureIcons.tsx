import { useState } from 'react'
import type { FeatureDto } from '../../../contracts/feature'
import { classNames } from '../utils/classNames'
import styles from './FeatureIcons.module.css'

export interface FeatureIconsProps {
  features: FeatureDto[]
}

function FeatureIcon({ iconPath }: { iconPath: string | null }) {
  const [hasImageError, setHasImageError] = useState(false)

  if (iconPath && !hasImageError) {
    return (
      <img className={styles.icon} src={iconPath} alt="" onError={() => setHasImageError(true)} />
    )
  }

  return (
    <svg
      className={classNames(styles.icon, styles.fallbackIcon)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m12 3.75 2.2 5.4 5.8.45-4.45 3.75 1.4 5.65L12 15.95l-4.95 3.05 1.4-5.65L4 9.6l5.8-.45L12 3.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function FeatureIcons({ features }: FeatureIconsProps) {
  if (features.length === 0) {
    return null
  }

  return (
    <ul className={styles.list} aria-label="Features">
      {features.map((feature) => (
        <li className={styles.feature} key={`${feature.id}:${feature.iconPath ?? ''}`}>
          <FeatureIcon iconPath={feature.iconPath} />
          <span className={styles.label}>{feature.name}</span>
        </li>
      ))}
    </ul>
  )
}
