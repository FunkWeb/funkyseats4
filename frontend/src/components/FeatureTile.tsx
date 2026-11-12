import type { FeatureDto } from '../../../contracts/feature'
import { classNames } from '../utils/classNames'
import { FeatureIcon } from './FeatureIcons'
import styles from './FeatureTile.module.css'

export interface FeatureTileProps {
  feature: FeatureDto
  selected?: boolean
  onClick?: (feature: FeatureDto) => void
  className?: string
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
        <FeatureIcon iconPath={feature.iconPath} />
      </span>
      <span className={styles.name}>{feature.name}</span>
    </button>
  )
}
