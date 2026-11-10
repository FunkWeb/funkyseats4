import { classNames } from '../utils/classNames'
import { Avatar, type AvatarSize } from './Avatar'
import styles from './UserIdentity.module.css'

export interface UserIdentityProps {
  name: string
  subtitle?: string
  avatarSrc?: string
  size?: AvatarSize
  className?: string
}

export function UserIdentity({
  name,
  subtitle,
  avatarSrc,
  size = 'md',
  className,
}: UserIdentityProps) {
  return (
    <div className={classNames(styles.userIdentity, styles[size], className)}>
      <Avatar src={avatarSrc} name={name} alt="" size={size} />
      <div className={styles.details}>
        <span className={styles.name}>{name}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  )
}
