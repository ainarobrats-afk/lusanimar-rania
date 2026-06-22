// ============================================================================
// RANIA — Pages Function: /chat
// Frontend (Home.tsx) calls POST /chat → forward ke rania-parser /api/chat
// ============================================================================

const PARSER_URL = "https://rania-parser.lusanimar.workers.dev";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-session-id",
  "Access-Control-Max-Age": "86400",
};

interface Env {
  WORKER_PARSER_URL?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const parserBase = env.WORKER_PARSER_URL || PARSER_URL;
  const targetUrl = `${parserBase}/api/chat`;

  try {
    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" ? request.body : undefined,
    });

    const response = await fetch(proxyReq);
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
      JSON.stringify({ error: "Chat proxy error", detail: msg }),
      { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}
