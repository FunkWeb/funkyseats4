import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { Button } from './Button'
import { CloseIcon } from './icons/CloseIcon'
import { MenuIcon } from './icons/MenuIcon'
import styles from './MobileTopBar.module.css'

const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

export interface MobileTopBarProps {
  isMenuOpen: boolean
  onMenuToggle: () => void
  menuId: string
  children: ReactNode
}

export function MobileTopBar({ isMenuOpen, onMenuToggle, menuId, children }: MobileTopBarProps) {
  const drawerRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return

    if (isMenuOpen && !drawer.open) drawer.showModal()
    if (!isMenuOpen && drawer.open) drawer.close()
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return

    const mobileMediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (!event.matches) drawerRef.current?.close()
    }

    mobileMediaQuery.addEventListener('change', handleBreakpointChange)
    return () => mobileMediaQuery.removeEventListener('change', handleBreakpointChange)
  }, [isMenuOpen])

  function closeDrawer() {
    drawerRef.current?.close()
  }

  function handleDrawerClose() {
    if (isMenuOpen) onMenuToggle()
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeDrawer()
  }

  return (
    <>
      <header className={styles.topBar}>
        <Button
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
      <dialog
        ref={drawerRef}
        id={menuId}
        className={styles.drawer}
        aria-labelledby={`${menuId}-title`}
        onClose={handleDrawerClose}
        onClick={handleBackdropClick}
      >
        <div className={styles.drawerHeader}>
          <h2 id={`${menuId}-title`} className={styles.drawerTitle}>
            Funkyseats
          </h2>
          <Button
            variant="ghost"
            icon={<CloseIcon />}
            aria-label="Lukk meny"
            onClick={closeDrawer}
            className={styles.closeButton}
          >
            Lukk
          </Button>
        </div>
        {children}
      </dialog>
    </>
  )
}
