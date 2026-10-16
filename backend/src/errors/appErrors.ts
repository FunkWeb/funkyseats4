export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`)
  }
}

export class ConflictError extends AppError {}

export class ForbiddenError extends AppError {}

export class ValidationError extends AppError {}
