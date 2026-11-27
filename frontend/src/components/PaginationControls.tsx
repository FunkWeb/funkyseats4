import { Button } from './Button'
import styles from './PaginationControls.module.css'

export interface PaginationControlsProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationControlsProps) {
  if (total <= pageSize) return null

  return (
    <div className={styles.paging}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        Forrige
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page * pageSize >= total}
        onClick={() => onPageChange(page + 1)}
      >
        Neste
      </Button>
    </div>
  )
}
