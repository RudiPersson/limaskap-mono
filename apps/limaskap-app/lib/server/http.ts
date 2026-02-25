import { ZodError } from "zod";

import {
  DomainError,
  ValidationDomainError,
  isDomainError,
} from "@/lib/server/errors";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function notFound(message = "Not Found") {
  return json({ message }, 404);
}

export function unauthorized(message = "Unauthorized") {
  return json({ message }, 401);
}

export function badRequest(message = "Bad Request") {
  return json({ message }, 400);
}

export function conflict(message: string) {
  return json({ message }, 409);
}

export function zodErrorResponse(error: ZodError) {
  return json(
    {
      success: false,
      error: {
        issues: error.issues,
        name: "ZodError",
      },
    },
    422,
  );
}

export function domainErrorResponse(error: DomainError) {
  if (error instanceof ValidationDomainError && error.details) {
    return json(error.details, error.status);
  }

  return json({ message: error.message }, error.status);
}

export function toRouteErrorResponse(error: unknown) {
  if (isDomainError(error)) {
    return domainErrorResponse(error);
  }
  throw error;
}

export function parseId(value: string) {
  const id = Number.parseInt(value, 10);
  if (!Number.isFinite(id)) {
    return null;
  }
  return id;
}
