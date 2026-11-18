import type { Pool, RowDataPacket } from 'mysql2/promise'
import type { PaginatedResponse, Pagination } from '../../../contracts/pagination.js'
import type { QueryParams } from './queryParams.js'

type CountRow = { total: number } & RowDataPacket

export type Page<T> = Pick<PaginatedResponse<T>, 'items' | 'total'>

interface PageQuery<T> {
  select: (clause: string, params: QueryParams) => Promise<T[]>
  table: string
  where?: string
  orderBy: string
  params?: QueryParams
}

export const paginate = async <T>(
  db: Pick<Pool, 'execute'>,
  { select, table, where = '', orderBy, params = {} }: PageQuery<T>,
  { page, pageSize }: Pagination,
): Promise<Page<T>> => {
  const [items, [countRows]] = await Promise.all([
    select(`${where} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`, {
      ...params,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM ${table} ${where}`, params),
  ])
  return { items, total: Number(countRows[0]?.total ?? 0) }
}
