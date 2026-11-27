import { useState, type CSSProperties } from 'react'
import { isValidIconPath, type FeatureDto } from '../../../contracts/feature'
import { classNames } from '../utils/classNames'
import styles from './FeatureIcons.module.css'
import { StarIcon } from './icons/StarIcon'

export interface FeatureIconsProps {
  features: Pick<FeatureDto, 'id' | 'name' | 'iconPath'>[]
  hideLabels?: boolean
  maxVisible?: number
  className?: string
}

const BLOB_ID_PATTERN = /^[A-Za-z0-9-]+$/

function isLocalBlobUrl(url: string): boolean {
  const prefix = `blob:${window.location.origin}/`
  return url.startsWith(prefix) && BLOB_ID_PATTERN.test(url.slice(prefix.length))
}

function isSafeIconUrl(url: string): boolean {
  return isValidIconPath(url) || isLocalBlobUrl(url)
}

export function FeatureIcon({ iconPath }: { iconPath: string | null }) {
  const [failedIconPath, setFailedIconPath] = useState<string | null>(null)
  const safeIconPath = iconPath && isSafeIconUrl(iconPath) ? iconPath : null

  if (safeIconPath && failedIconPath !== safeIconPath) {
    return (
      <>
        <span
          className={classNames(styles.icon, styles.maskIcon)}
          style={{ '--icon-url': `url(${JSON.stringify(safeIconPath)})` } as CSSProperties}
        />
        <img
          className={styles.loadProbe}
          src={safeIconPath}
          alt=""
          onError={() => setFailedIconPath(safeIconPath)}
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

export function FeatureIcons({
  features,
  hideLabels = false,
  maxVisible,
  className,
}: FeatureIconsProps) {
  if (features.length === 0) {
    return null
  }

  const overflowing = maxVisible !== undefined && features.length > maxVisible
  const visibleFeatures = overflowing ? features.slice(0, Math.max(maxVisible - 1, 0)) : features
  const hiddenFeatures = overflowing ? features.slice(visibleFeatures.length) : []
  const hiddenNames = hiddenFeatures.map((feature) => feature.name).join(', ')

  return (
    <ul
      className={classNames(styles.list, hideLabels && styles.hideLabels, className)}
      aria-label="Funksjoner"
    >
      {visibleFeatures.map((feature) => (
        <li
          className={styles.feature}
          key={`${feature.id}:${feature.iconPath ?? ''}`}
          aria-label={feature.name}
          tabIndex={hideLabels ? 0 : undefined}
        >
          <FeatureIcon iconPath={feature.iconPath} />
          <span className={styles.label}>{feature.name}</span>
        </li>
      ))}
      {hiddenFeatures.length > 0 && (
        <li
          className={styles.feature}
          aria-label={hiddenNames}
          tabIndex={hideLabels ? 0 : undefined}
        >
          <span className={styles.overflowChip} aria-hidden>
            +{hiddenFeatures.length}
          </span>
          <span className={styles.label}>{hiddenNames}</span>
        </li>
      )}
    </ul>
  )
}
