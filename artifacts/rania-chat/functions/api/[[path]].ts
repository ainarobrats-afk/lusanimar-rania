// ============================================================================
// RANIA — Cloudflare Pages Functions API Proxy
// Semua request /api/* diteruskan ke rania-parser (AI engine utama)
// ============================================================================

interface Env {
  BACKEND_V2?: string;
  WORKER_PARSER_URL?: string;
}

const PARSER_URL = "https://rania-parser.lusanimar.workers.dev";
const BACKEND_FALLBACK = "https://rania-backend-v2.lusanimar.workers.dev";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-session-id",
  "Access-Control-Max-Age": "86400",
};

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}): Promise<Response> {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const path = url.pathname; // e.g. /api/chat, /api/health, /api/search

  // ─── Route ke worker yang tepat berdasarkan path ──────────────────────────

  let targetBase: string;

  if (
    path.startsWith("/api/chat") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/ads")
  ) {
    // Parser handles: chat, health, ads topup/campaign/click
    targetBase = env.WORKER_PARSER_URL || PARSER_URL;
  } else if (path.startsWith("/api/search") || path.startsWith("/rania/flights")) {
    // Hunter handles: flight search
    targetBase = "https://rania-hunter.lusanimar.workers.dev";
  } else if (path.startsWith("/api/checkout") || path.startsWith("/api/payment")) {
    // Cashier handles: Xendit checkout
    targetBase = "https://rania-cashier.lusanimar.workers.dev";
  } else if (path.startsWith("/api/validate")) {
    // Validator handles: passport OCR
    targetBase = "https://rania-validator.lusanimar.workers.dev";
  } else if (path.startsWith("/api/webhook")) {
    // Webhook handles: Xendit payment callbacks
    targetBase = "https://rania-webhook.lusanimar.workers.dev";
  } else if (path.startsWith("/api/admin") || path.startsWith("/api/book")) {
    // Admin + Pilot
    targetBase = "https://rania-admin.lusanimar.workers.dev";
  } else {
    // Default: parser (AI engine)
    targetBase = env.BACKEND_V2 || env.WORKER_PARSER_URL || PARSER_URL;
  }

  // ─── Forward request ──────────────────────────────────────────────────────

  const targetUrl = `${targetBase}${path}${url.search}`;

  try {
    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
    });

    const response = await fetch(proxyReq);

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Proxy error";
    return new Response(
      JSON.stringify({ error: "API proxy error", detail: msg }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      }
    );
  }
}
