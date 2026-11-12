export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly lockoutRemainingSeconds?: number;

  constructor(
    message: string,
    statusCode = 500,
    options?: { details?: unknown; lockoutRemainingSeconds?: number; isOperational?: boolean },
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;
    this.lockoutRemainingSeconds = options?.lockoutRemainingSeconds;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, { details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, { details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests', lockoutRemainingSeconds?: number) {
    super(message, 429, { lockoutRemainingSeconds });
  }
}

