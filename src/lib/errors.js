import { NextResponse } from 'next/server.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class TenantNotFoundError extends AppError {
  constructor(tenantId) {
    super(`Tenant with ID "${tenantId}" was not found.`, 404, 'TENANT_NOT_FOUND');
  }
}

export class TenantSuspendedError extends AppError {
  constructor(tenantId) {
    super(`Tenant "${tenantId}" is currently suspended or inactive.`, 403, 'TENANT_SUSPENDED');
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(databaseName, originalMessage = '') {
    super(
      `Failed to establish database connection for "${databaseName}".${originalMessage ? ` Reason: ${originalMessage}` : ''}`,
      503,
      'DATABASE_CONNECTION_ERROR'
    );
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', retryAfterSeconds = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Standardized API error response handler
 * Masks internal database errors and stack traces in production while preserving operational messages.
 *
 * @param {any} error
 * @param {string} [fallbackMessage]
 * @returns {Response}
 */
export function handleApiError(error, fallbackMessage = 'An unexpected error occurred.') {
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        message: error.message,
        retryAfter: error.retryAfterSeconds,
      },
      {
        status: error.statusCode,
        headers: { 'Retry-After': String(error.retryAfterSeconds) },
      }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      },
      { status: error.statusCode }
    );
  }

  if (error?.name === 'ZodError') {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data.',
        errors: error.errors || error.issues,
      },
      { status: 400 }
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage = isProduction ? fallbackMessage : (error?.message || fallbackMessage);

  return NextResponse.json(
    { success: false, code: 'INTERNAL_SERVER_ERROR', message: responseMessage },
    { status: 500 }
  );
}

