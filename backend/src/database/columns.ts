import type { QueryParams } from './queryParams.js'

const toSnakeCase = (field: string) =>
  field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

export const pickColumns = <T extends object>(
  writableFields: readonly (keyof NoInfer<T> & string)[],
  input: T,
) => {
  const fields = writableFields.filter((field) => input[field] !== undefined)
  const columns = fields.map(toSnakeCase)
  return {
    columns,
    placeholders: fields.map((field) => `:${field}`),
    assignments: fields.map((field, index) => `${columns[index]} = :${field}`),
    params: Object.fromEntries(fields.map((field) => [field, input[field]])) as QueryParams,
  }
}
