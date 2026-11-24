import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { CloseIcon } from './icons/CloseIcon'
import { MenuIcon } from './icons/MenuIcon'
import styles from './MobileTopBar.module.css'

export interface MobileTopBarProps {
  isMenuOpen: boolean
  onMenuToggle: () => void
  menuId: string
  children: ReactNode
}

export function MobileTopBar({ isMenuOpen, onMenuToggle, menuId, children }: MobileTopBarProps) {
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)
  const onMenuToggleRef = useRef(onMenuToggle)
  onMenuToggleRef.current = onMenuToggle

  useEffect(() => {
    if (!isMenuOpen) {
      if (wasOpen.current) menuButtonRef.current?.focus()
      wasOpen.current = false
      return
    }

    wasOpen.current = true
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onMenuToggleRef.current()
        return
      }

      if (event.key !== 'Tab' || !drawerRef.current) return

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) {
        event.preventDefault()
        drawerRef.current.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !drawerRef.current.contains(document.activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !drawerRef.current.contains(document.activeElement))
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

  return (
    <>
      <header className={styles.topBar}>
        <Button
          ref={menuButtonRef}
          variant="ghost"
          icon={<MenuIcon />}
          aria-label={isMenuOpen ? 'Lukk meny' : 'Åpne meny'}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={onMenuToggle}
          className={styles.menuButton}
        >
          Meny
        </Button>
        <span className={styles.topBarTitle}>Funkyseats</span>
      </header>
      <button
        type="button"
        className={`${styles.overlay} ${isMenuOpen ? styles.overlayOpen : ''}`}
        aria-label="Lukk meny"
        tabIndex={-1}
        inert={!isMenuOpen}
        onClick={onMenuToggle}
      />
      <div
        ref={drawerRef}
        id={menuId}
        className={`${styles.drawer} ${isMenuOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal={isMenuOpen || undefined}
        aria-labelledby={`${menuId}-title`}
        inert={!isMenuOpen}
        tabIndex={-1}
      >
        <div className={styles.drawerHeader}>
          <h2 id={`${menuId}-title`} className={styles.drawerTitle}>
            Funkyseats
          </h2>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            icon={<CloseIcon />}
            aria-label="Lukk meny"
            onClick={onMenuToggle}
            className={styles.closeButton}
          >
            Lukk
          </Button>
        </div>
        {children}
      </div>
    </>
  )
}
