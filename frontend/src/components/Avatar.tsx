import { useState } from 'react'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
  className?: string
}

function getInitials(name?: string): string {
  if (!name) return ''
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].charAt(0)
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
}

export function Avatar({ src, alt = '', name, size = 'md', className }: AvatarProps) {
  const avatarClassName = [styles.avatar, styles[size], className].filter(Boolean).join(' ')

  const initials = getInitials(name)
  const [failedSrc, setFailedSrc] = useState<string>()
  const showImage = src && src !== failedSrc

  return (
    <div className={avatarClassName}>
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={styles.image}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  )
}
