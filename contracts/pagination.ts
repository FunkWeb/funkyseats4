export interface Pagination {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> extends Pagination {
  items: T[]
  total: number
}
