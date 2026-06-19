// ============================================================================
// RANIA V2.1 — Standard Error Responses
// ============================================================================

import { corsJsonResponse } from "./cors";

export function badRequest(message: string, details?: unknown): Response {
  return corsJsonResponse(
    { error: "BAD_REQUEST", message, details },
    { status: 400 }
  );
}

export function unauthorized(message = "Unauthorized"): Response {
  return corsJsonResponse(
    { error: "UNAUTHORIZED", message },
    { status: 401 }
  );
}

export function forbidden(message = "Forbidden"): Response {
  return corsJsonResponse(
    { error: "FORBIDDEN", message },
    { status: 403 }
  );
}

export function notFound(message = "Not Found"): Response {
  return corsJsonResponse(
    { error: "NOT_FOUND", message },
    { status: 404 }
  );
}

export function conflict(message: string): Response {
  return corsJsonResponse(
    { error: "CONFLICT", message },
    { status: 409 }
  );
}

export function serverError(message = "Internal server error", details?: unknown): Response {
  return corsJsonResponse(
    { error: "INTERNAL_ERROR", message, details },
    { status: 500 }
  );
}

export function serviceUnavailable(message = "Service temporarily unavailable"): Response {
  return corsJsonResponse(
    { error: "SERVICE_UNAVAILABLE", message },
    { status: 503 }
  );
}

/**
 * Standardized error response for API failures.
 * Never exposes internal details to the client.
 */
export function apiError(code: string, message: string, status = 500): Response {
  return corsJsonResponse(
    { error: code, message },
    { status }
  );
}

/**
 * "Data not available" — used when flight/hotel search returns no results.
 * IRON RULE: This is the ONLY acceptable fallback when API returns no data.
 * Never show estimated/indication prices.
 */
export function dataUnavailable(resource: string): Response {
  return corsJsonResponse(
    {
      error: "DATA_UNAVAILABLE",
      message: `Data ${resource} tidak tersedia`,
      results: [],
    },
    { status: 404 }
  );
}
