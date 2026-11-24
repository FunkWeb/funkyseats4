import type { ReactNode } from 'react'
import type { FeatureDto } from '../../../contracts/feature'
import type { UserDto } from '../../../contracts/user'
import { Card } from './Card'
import { FeatureIcons } from './FeatureIcons'
import { UserIdentity } from './UserIdentity'
import { classNames } from '../utils/classNames'
import styles from './SeatCard.module.css'

const MAX_VISIBLE_FEATURES = 6

export interface SeatCardProps {
  seatName: string
  features: Pick<FeatureDto, 'id' | 'name' | 'iconPath' | 'category'>[]
  occupant?: Pick<UserDto, 'name' | 'avatarPath'>
  occupantDetail?: string
  freeLabel?: string
  muted?: boolean
  error?: string
  periodControl?: ReactNode
  actions?: ReactNode
  className?: string
}

export function SeatCard({
  seatName,
  features,
  occupant,
  occupantDetail,
  freeLabel = 'Ledig',
  muted = false,
  error,
  periodControl,
  actions,
  className,
}: SeatCardProps) {
  const osFeatures = features.filter((feature) => feature.category === 'OS')
  const otherFeatures = features.filter((feature) => feature.category !== 'OS')

  return (
    <Card variant={muted ? 'muted' : 'default'} className={classNames(styles.seatCard, className)}>
      <div className={styles.header}>
        {occupant ? (
          <UserIdentity
            size="sm"
            name={occupant.name}
            subtitle={occupantDetail}
            avatarSrc={occupant.avatarPath ?? undefined}
          />
        ) : (
          <span className={classNames(styles.freeLabel, muted && styles.freeLabelMuted)}>
            {freeLabel}
          </span>
        )}
      </div>

      <div className={styles.titleRow}>
        <h3 className={styles.title}>{seatName}</h3>
        {osFeatures.length > 0 && (
          <div className={styles.os}>
            <span className={styles.osLabel}>OS:</span>
            <FeatureIcons features={osFeatures} hideLabels className={styles.features} />
          </div>
        )}
      </div>

      {otherFeatures.length > 0 && (
        <FeatureIcons
          features={otherFeatures}
          hideLabels
          maxVisible={MAX_VISIBLE_FEATURES}
          className={styles.features}
        />
      )}

      {(periodControl || error || actions) && (
        <div className={styles.footer}>
          {periodControl}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {actions && (
            <div className={classNames(styles.actions, muted && styles.mutedActions)}>
              {actions}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
