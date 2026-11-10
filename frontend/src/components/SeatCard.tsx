import type { ReactNode } from 'react'
import type { UserDto } from '../../../contracts/user'
import type { FeatureIconsProps } from './FeatureIcons'
import { Card } from './Card'
import { FeatureIcons } from './FeatureIcons'
import { UserIdentity } from './UserIdentity'
import { classNames } from '../utils/classNames'
import styles from './SeatCard.module.css'

export interface SeatCardProps {
  seatName: string
  features: FeatureIconsProps['features']
  occupant?: Pick<UserDto, 'name' | 'avatarPath'>
  freeLabel?: string
  muted?: boolean
  status?: string
  actions?: ReactNode
  className?: string
}

export function SeatCard({
  seatName,
  features,
  occupant,
  freeLabel = 'Ledig',
  muted = false,
  status,
  actions,
  className,
}: SeatCardProps) {
  return (
    <Card variant={muted ? 'muted' : 'default'} className={classNames(styles.seatCard, className)}>
      <div className={styles.header}>
        {occupant ? (
          <UserIdentity size="sm" name={occupant.name} avatarSrc={occupant.avatarPath ?? undefined} />
        ) : (
          <span className={styles.freeLabel}>{freeLabel}</span>
        )}
        <FeatureIcons features={features} hideLabels className={styles.features} />
      </div>

      <h3 className={styles.title}>{seatName}</h3>

      {(status || actions) && (
        <div className={styles.footer}>
          {status && <p className={classNames(styles.status, muted && styles.unavailable)}>{status}</p>}
          {actions}
        </div>
      )}
    </Card>
  )
}
