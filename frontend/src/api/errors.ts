export class HttpError extends Error {
  name = 'HttpError'

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export class ValidationError extends HttpError {
  name = 'ValidationError'

  constructor(message: string) {
    super(message, 400)
  }
}

export class UnauthorizedError extends HttpError {
  name = 'UnauthorizedError'

  constructor(message: string) {
    super(message, 401)
  }
}

export class ForbiddenError extends HttpError {
  name = 'ForbiddenError'

  constructor(message: string) {
    super(message, 403)
  }
}

export class NotFoundError extends HttpError {
  name = 'NotFoundError'

  constructor(message: string) {
    super(message, 404)
  }
}

export class ConflictError extends HttpError {
  name = 'ConflictError'

  constructor(message: string) {
    super(message, 409)
  }
}

export class RateLimitError extends HttpError {
  name = 'RateLimitError'

  constructor(message: string) {
    super(message, 429)
  }
}

const errorsByStatus: Partial<Record<number, new (message: string) => HttpError>> = {
  400: ValidationError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  409: ConflictError,
  429: RateLimitError,
}

export function createHttpError(message: string, status: number): HttpError {
  const ErrorClass = errorsByStatus[status]
  return ErrorClass ? new ErrorClass(message) : new HttpError(message, status)
}
