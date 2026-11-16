import type { ErrorResponse } from '../../../contracts/error'
import { createHttpError } from './errors'

export { UnauthorizedError } from './errors'

async function readErrorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as Partial<ErrorResponse> | null
  return typeof body?.errorMessage === 'string' ? body.errorMessage : response.statusText
}

async function requestWithInit<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)

  if (!response.ok) {
    throw createHttpError(await readErrorMessage(response), response.status)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit =
    body === undefined
      ? { method }
      : { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }

  return requestWithInit<T>(path, init)
}

export const get = <T>(path: string) => request<T>('GET', path)
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
export const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body)
export const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body)
export const del = <T>(path: string) => request<T>('DELETE', path)
export const postFile = <T>(path: string, file: Blob, contentType: string): Promise<T> =>
  requestWithInit<T>(path, {
    method: 'POST',
    body: file,
    headers: { 'Content-Type': contentType },
  })
