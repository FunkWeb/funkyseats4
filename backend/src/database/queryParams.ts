import type { Pool } from 'mysql2/promise'

type ExecuteValues = NonNullable<Parameters<Pool['execute']>[1]>

export type QueryParams = Record<string, ExecuteValues>
