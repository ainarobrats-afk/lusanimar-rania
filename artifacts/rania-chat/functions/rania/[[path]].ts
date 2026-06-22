// ============================================================================
// RANIA — Pages Function: /rania/*
// Frontend calls:
//   POST /rania/chat        → parser /api/chat (legacy V2.0 format)
//   GET  /rania/flights     → hunter /api/search
//   GET  /rania/weather     → parser /api/chat (get_weather tool)
//   GET  /rania/visa        → parser /api/chat (get_visa_info tool)
//   GET  /rania/status/:id  → parser /api/health (booking status)
//   GET  /rania/bookings    → parser
//   GET  /rania/revenue-by-currency → parser
// ============================================================================

const PARSER_URL  = "https://rania-parser.lusanimar.workers.dev";
const HUNTER_URL  = "https://rania-hunter.lusanimar.workers.dev";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-session-id, x-admin-token",
  "Access-Control-Max-Age": "86400",
};

interface Env {
  WORKER_PARSER_URL?: string;
  WORKER_HUNTER_URL?: string;
}

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url    = new URL(request.url);
  const path   = url.pathname;            // e.g. /rania/chat, /rania/flights
  const parser = env.WORKER_PARSER_URL || PARSER_URL;
  const hunter = env.WORKER_HUNTER_URL || HUNTER_URL;

  // ─── /rania/flights?from=DIL&to=DPS&date=... ──────────────────────────────
  if (path === "/rania/flights") {
    const from = url.searchParams.get("from") || "";
    const to   = url.searchParams.get("to")   || "";
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);

    if (!from || !to) {
      return jsonResp({ error: "from and to required", flights: [] }, 400);
    }

    try {
      const res = await fetch(`${hunter}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: from, destination: to, departureDate: date }),
      });
      const data = await res.json();
      const newH = new Headers(res.headers);
      Object.entries(CORS).forEach(([k, v]) => newH.set(k, v));
      return new Response(JSON.stringify(data), { status: res.status, headers: newH });
    } catch (e) {
      return jsonResp({ error: "Hunter error", flights: [] }, 502);
    }
  }

  // ─── /rania/chat  (legacy V2.0 format from Home.tsx) ─────────────────────
  if (path === "/rania/chat") {
    try {
      let body: Record<string, unknown> = {};
      if (request.method === "POST") {
        body = await request.json() as Record<string, unknown>;
      }

      // Convert legacy { messages, lang } → new { pesan, tipe_chat }
      const messages = (body.messages as Array<{ role: string; content: string }>) || [];
      const lastUser = messages.filter(m => m.role === "user").pop()?.content || "";
      const pesan    = lastUser || String(body.pesan || "");

      const parserBody = {
        pesan,
        tipe_chat: "travel",
        session_id: request.headers.get("x-session-id") || `sess-legacy-${Date.now()}`,
        messages,  // pass history too for context
      };

      const res = await fetch(`${parser}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": request.headers.get("x-session-id") || "",
          "x-request-id": request.headers.get("x-request-id") || "",
        },
        body: JSON.stringify(parserBody),
      });

      const data = await res.json() as Record<string, unknown>;

      // Normalize response to match legacy format expected by Home.tsx
      const reply   = String(data.jawaban || data.reply || "");
      const detLang = String(data.detectedLang || body.lang || "id");

      const newH = new Headers();
      Object.entries(CORS).forEach(([k, v]) => newH.set(k, v));
      newH.set("Content-Type", "application/json");

      return new Response(JSON.stringify({
        reply,
        jawaban: reply,
        detectedLang: detLang,
        lang: detLang,
        intent: data.functionCalled === "search_flights" ? "flight" : "general",
        functionCalled: data.functionCalled,
        functionResult: data.functionResult,
        flights: data.functionResult && (data.functionResult as Record<string, unknown>).flights
          ? (data.functionResult as Record<string, unknown>).flights
          : undefined,
        from: data.functionCalled === "search_flights"
          ? ((data.functionResult as Record<string, unknown>)?.flights as Array<{from:string}>)?.[0]?.from
          : undefined,
        to: data.functionCalled === "search_flights"
          ? ((data.functionResult as Record<string, unknown>)?.flights as Array<{to:string}>)?.[0]?.to
          : undefined,
        provider: data.provider,
        tipe_chat: "travel",
      }), { status: 200, headers: newH });
    } catch (e) {
      return jsonResp({
        reply: "Hau la konsege konekta agora. Favor tenta fila-fali.",
        intent: "general",
      }, 200);
    }
  }

  // ─── /rania/weather?city=... ──────────────────────────────────────────────
  if (path === "/rania/weather") {
    const city = url.searchParams.get("city") || "Dili";
    try {
      const res = await fetch(`${parser}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesan: `weather in ${city}`,
          tipe_chat: "travel",
          session_id: "weather-query",
        }),
      });
      const data = await res.json();
      const newH = new Headers();
      Object.entries(CORS).forEach(([k, v]) => newH.set(k, v));
      newH.set("Content-Type", "application/json");
      return new Response(JSON.stringify(data), { status: 200, headers: newH });
    } catch {
      return jsonResp({ city, temp: 28, condition: "Sunny" }, 200);
    }
  }

  // ─── /rania/visa?from=...&to=... ─────────────────────────────────────────
  if (path === "/rania/visa") {
    const from = url.searchParams.get("from") || "Timor-Leste";
    const to   = url.searchParams.get("to")   || "";
    try {
      const res = await fetch(`${parser}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesan: `visa requirements from ${from} to ${to}`,
          tipe_chat: "travel",
          session_id: "visa-query",
        }),
      });
      const data = await res.json();
      const newH = new Headers();
      Object.entries(CORS).forEach(([k, v]) => newH.set(k, v));
      newH.set("Content-Type", "application/json");
      return new Response(JSON.stringify(data), { status: 200, headers: newH });
    } catch {
      return jsonResp({ from, to, info: "Please check official embassy." }, 200);
    }
  }

  // ─── /rania/status/:id, /rania/bookings, /rania/* → forward to parser ────
  try {
    const targetUrl = `${parser}/api${path.replace("/rania", "")}${url.search}`;
    const proxyReq  = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });
    const response = await fetch(proxyReq);
    const newH     = new Headers(response.headers);
    Object.entries(CORS).forEach(([k, v]) => newH.set(k, v));
    return new Response(response.body, {
      status: response.status,
      headers: newH,
    });
  } catch (error) {
    return jsonResp({ error: "Proxy error", path }, 502);
  }
}
