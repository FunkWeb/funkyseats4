import { useState, type CSSProperties, type ReactElement, type SVGProps } from 'react'
import type { FeatureDto } from '../../../contracts/feature'
import { classNames } from '../utils/classNames'
import { StarIcon } from './icons/StarIcon'
import styles from './FeatureTile.module.css'

export type ExtendedFeatureDto = FeatureDto & {
  icon?: ReactElement<SVGProps<SVGSVGElement>>
}

export interface FeatureTileProps {
  feature: ExtendedFeatureDto
  selected?: boolean
  onClick?: (feature: ExtendedFeatureDto) => void
  className?: string
}

function TileIcon({ feature }: { feature: ExtendedFeatureDto }) {
  const [hasImageError, setHasImageError] = useState(false)

  if (feature.icon) {
    return feature.icon
  }

  if (feature.iconPath && !hasImageError) {
    return (
      <>
        <span
          className={styles.svgMask}
          style={{ '--icon-url': `url("${feature.iconPath}")` } as CSSProperties}
        />
        <img src={feature.iconPath} alt="" hidden onError={() => setHasImageError(true)} />
      </>
    )
  }

  return <StarIcon />
}

export function FeatureTile({ feature, selected = false, onClick, className }: FeatureTileProps) {
  return (
    <button
      type="button"
      className={classNames(styles.tile, selected && styles.selected, className)}
      aria-pressed={selected}
      title={feature.description ?? undefined}
      onClick={() => onClick?.(feature)}
    >
      <span className={styles.icon} aria-hidden="true">
        <TileIcon feature={feature} />
      </span>
      <span className={styles.name}>{feature.name}</span>
    </button>
  )
}
