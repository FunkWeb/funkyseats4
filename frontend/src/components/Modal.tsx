import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { classNames } from '../utils/classNames'
import { IconButton } from './IconButton'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, title, onClose, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [nativeCloseCount, setNativeCloseCount] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open, nativeCloseCount])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  function handleNativeClose() {
    if (!open) return
    setNativeCloseCount((count) => count + 1)
    onClose()
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleBackdropClick}
    >
      {open && (
        <div className={classNames(styles.panel, className)}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <IconButton icon="✕" onClick={onClose} aria-label="Lukk" variant="ghost" />
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
