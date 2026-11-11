export class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
    ) {
      return body.error
    }
  } catch {
    return response.statusText
  }

  return response.statusText
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  const response = await fetch(`/api${path}`, init)

  if (!response.ok) {
    const message = await readErrorMessage(response)

    if (response.status === 401) {
      throw new UnauthorizedError(message)
    }

    throw new HttpError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body)
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body)
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body)
}

export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path)
}
