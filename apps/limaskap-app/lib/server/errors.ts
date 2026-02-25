import { ZodError } from "zod";

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class BadRequestDomainError extends DomainError {
  constructor(message = "Bad Request", details?: unknown) {
    super(message, 400, details);
    this.name = "BadRequestDomainError";
  }
}

export class UnauthorizedDomainError extends DomainError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, 401, details);
    this.name = "UnauthorizedDomainError";
  }
}

export class NotFoundDomainError extends DomainError {
  constructor(message = "Not Found", details?: unknown) {
    super(message, 404, details);
    this.name = "NotFoundDomainError";
  }
}

export class ConflictDomainError extends DomainError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, details);
    this.name = "ConflictDomainError";
  }
}

export class ValidationDomainError extends DomainError {
  constructor(message = "Validation error", details?: unknown) {
    super(message, 422, details);
    this.name = "ValidationDomainError";
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function toZodErrorPayload(error: ZodError) {
  return {
    success: false as const,
    error: {
      issues: error.issues,
      name: "ZodError" as const,
    },
  };
}
