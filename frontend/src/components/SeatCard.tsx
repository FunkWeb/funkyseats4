import type { ReactNode } from 'react'
import type { UserDto } from '../../../contracts/user'
import type { FeatureIconsProps } from './FeatureIcons'
import { Card } from './Card'
import { FeatureIcons } from './FeatureIcons'
import { UserIdentity } from './UserIdentity'
import { classNames } from '../utils/classNames'
import styles from './SeatCard.module.css'

const MAX_VISIBLE_FEATURES = 6

export interface SeatCardProps {
  seatName: string
  features: FeatureIconsProps['features']
  occupant?: Pick<UserDto, 'name' | 'avatarPath'>
  occupantDetail?: string
  freeLabel?: string
  muted?: boolean
  status?: string
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
  status,
  periodControl,
  actions,
  className,
}: SeatCardProps) {
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

      <h3 className={styles.title}>{seatName}</h3>

      <FeatureIcons
        features={features}
        hideLabels
        maxVisible={MAX_VISIBLE_FEATURES}
        className={styles.features}
      />

      {(periodControl || status || actions) && (
        <div className={styles.footer}>
          {periodControl}
          {status && (
            <p className={classNames(styles.status, muted && styles.unavailable)}>{status}</p>
          )}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
    </Card>
  )
}
