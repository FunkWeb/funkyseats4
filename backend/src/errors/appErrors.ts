export abstract class AppError extends Error {
  abstract readonly status: number

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  readonly status = 400
}

export class UnauthorizedError extends AppError {
  readonly status = 401

  constructor() {
    super('Not signed in')
  }
}

export class ForbiddenError extends AppError {
  readonly status = 403
}

export class NotFoundError extends AppError {
  readonly status = 404

  constructor(resource: string) {
    super(`${resource} not found`)
  }
}

export class ConflictError extends AppError {
  readonly status = 409
}
