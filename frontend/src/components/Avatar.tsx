import { useState } from 'react'
import { classNames } from '../utils/classNames'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
  className?: string
}

function getInitials(name = ''): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0]?.charAt(0) ?? ''
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const avatarClassName = classNames(styles.avatar, styles[size], className)
  const label = alt ?? name ?? 'Avatar'
  const showImage = src && src !== failedSrc

  return (
    <div className={avatarClassName}>
      {showImage ? (
        <img src={src} alt={label} className={styles.image} onError={() => setFailedSrc(src)} />
      ) : (
        <span role="img" aria-label={label} className={styles.initials}>
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}
