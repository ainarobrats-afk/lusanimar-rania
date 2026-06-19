// ============================================================================
// RANIA V2.1 — CORS Helpers for Cloudflare Workers
// ============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-session-id",
  "Access-Control-Max-Age": "86400",
};

/**
 * Returns CORS headers for preflight (OPTIONS) requests.
 */
export function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Returns a JSON Response with CORS headers included.
 */
export function corsJsonResponse(
  data: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = options;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

/**
 * Check if the request is a preflight (OPTIONS) request.
 */
export function isPreflight(request: Request): boolean {
  return request.method === "OPTIONS";
}

/**
 * Wrap a fetch handler to automatically handle CORS preflight.
 */
export function withCors(handler: (request: Request, env: unknown, ctx: unknown) => Promise<Response>) {
  return async (request: Request, env: unknown, ctx: unknown): Promise<Response> => {
    if (isPreflight(request)) {
      return corsPreflightResponse();
    }
    try {
      return await handler(request, env, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      return corsJsonResponse({ error: message }, { status: 500 });
    }
  };
}

export { CORS_HEADERS };
