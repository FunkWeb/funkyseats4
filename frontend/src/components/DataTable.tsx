import type { ReactNode } from 'react'
import { Spinner } from './Spinner'
import styles from './DataTable.module.css'

export interface Column<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  className,
}: DataTableProps<T>) {
  const containerClassName = [styles.container, className].filter(Boolean).join(' ')

  if (loading) {
    return (
      <div className={containerClassName}>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className={containerClassName}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.headerCell}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: T, rowIndex: number) => (
            <tr key={rowIndex} className={styles.row}>
              {columns.map((col) => (
                <td key={col.key} className={styles.cell}>
                  {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
