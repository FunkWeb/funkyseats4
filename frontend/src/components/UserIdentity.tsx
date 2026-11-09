import { Avatar } from './Avatar'
import styles from './UserIdentity.module.css'

export interface UserIdentityProps {
  name: string
  subtitle?: string
  avatarSrc?: string
  className?: string
}

export function UserIdentity({ name, subtitle, avatarSrc, className }: UserIdentityProps) {
  const containerClassName = [styles.userIdentity, className].filter(Boolean).join(' ')

  return (
    <div className={containerClassName}>
      <Avatar src={avatarSrc} name={name} size="md" />
      <div className={styles.details}>
        <span className={styles.name}>{name}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  )
}
