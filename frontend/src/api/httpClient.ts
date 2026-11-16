import type { ErrorResponse } from '../../../contracts/error'
import { createHttpError } from './errors'

export { UnauthorizedError } from './errors'

async function readErrorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as Partial<ErrorResponse> | null
  return typeof body?.errorMessage === 'string' ? body.errorMessage : response.statusText
}

interface Payload {
  data: BodyInit
  contentType: string
}

async function fetchApi<T>(method: string, path: string, payload?: Payload): Promise<T> {
  const init: RequestInit =
    payload === undefined
      ? { method }
      : { method, body: payload.data, headers: { 'Content-Type': payload.contentType } }

  const response = await fetch(`/api${path}`, init)

  if (!response.ok) {
    throw createHttpError(await readErrorMessage(response), response.status)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  return body === undefined
    ? fetchApi<T>(method, path)
    : fetchApi<T>(method, path, { data: JSON.stringify(body), contentType: 'application/json' })
}

export const get = <T>(path: string) => request<T>('GET', path)
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
export const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body)
export const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body)
export const del = <T>(path: string) => request<T>('DELETE', path)
export const postFile = <T>(path: string, file: Blob, contentType: string) =>
  fetchApi<T>('POST', path, { data: file, contentType })
