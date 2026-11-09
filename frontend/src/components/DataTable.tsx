import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames'
import { Spinner } from './Spinner'
import styles from './DataTable.module.css'

type RenderableKey<T> = { [K in keyof T]: T[K] extends ReactNode ? K : never }[keyof T] & string

export type Column<T> =
  | { key: RenderableKey<T>; header: string }
  | { key: string; header: string; render: (row: T) => ReactNode }

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  emptyMessage = 'No results',
  className,
}: DataTableProps<T>) {
  const containerClassName = classNames(styles.container, className)

  if (isLoading) {
    return (
      <div className={containerClassName} aria-busy>
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
          {data.length === 0 ? (
            <tr className={styles.row}>
              <td colSpan={columns.length} className={classNames(styles.cell, styles.empty)}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)} className={styles.row}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.cell}>
                    {'render' in col ? col.render(row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
