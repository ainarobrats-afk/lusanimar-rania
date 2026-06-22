// ============================================================================
// RANIA — Pages Function: /admin/*
// Admin dashboard API calls → rania-admin worker
// ============================================================================

const ADMIN_URL  = "https://rania-admin.lusanimar.workers.dev";
const PARSER_URL = "https://rania-parser.lusanimar.workers.dev";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-request-id, x-session-id, x-admin-token",
  "Access-Control-Max-Age": "86400",
};

interface Env {
  WORKER_ADMIN_URL?: string;
  WORKER_PARSER_URL?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url      = new URL(request.url);
  const path     = url.pathname;
  const adminUrl = env.WORKER_ADMIN_URL || ADMIN_URL;
  const parser   = env.WORKER_PARSER_URL || PARSER_URL;

  // /admin/stats, /admin/live-ops, /admin/ai-status → mock responses
  // (these will connect to Supabase once DB is set up)
  if (path === "/admin/stats") {
    return new Response(JSON.stringify({
      chatsToday: 142, pendingBookings: 3, activeChatsNow: 7,
      totalUsers: 284, usersToday: 18, totalBookings: 56,
      totalRevenue: 12480, todayRevenue: 620, weekRevenue: 3200,
      monthRevenue: 12480, commissionToday: 31, commissionWeek: 160,
      commissionMonth: 624, commissionTotal: 624, commissionPct: 5,
      conversionRate: 4.2, avgResponseTime: 340, avgBookingValue: 223,
      netRevenue: 11856, refundedAmount: 0, uptimeStr: "99.9%", uptime: 99.9,
      dailyTrend: [
        { day: "Mon", revenue: 480, commission: 24 },
        { day: "Tue", revenue: 620, commission: 31 },
        { day: "Wed", revenue: 510, commission: 25 },
        { day: "Thu", revenue: 390, commission: 19 },
        { day: "Fri", revenue: 720, commission: 36 },
        { day: "Sat", revenue: 850, commission: 42 },
        { day: "Sun", revenue: 430, commission: 21 },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  }

  if (path === "/admin/live-ops") {
    return new Response(JSON.stringify({
      activeSessions: 7, avgResponseTimeMs: 340,
      countries: [
        { code: "TL", name: "Timor-Leste", flag: "🇹🇱", count: 89 },
        { code: "ID", name: "Indonesia", flag: "🇮🇩", count: 34 },
        { code: "AU", name: "Australia", flag: "🇦🇺", count: 12 },
        { code: "PT", name: "Portugal", flag: "🇵🇹", count: 5 },
      ],
      liveActivity: [
        { country: "Timor-Leste", action: "searching flights DIL→DPS", route: "DIL→DPS", time: new Date().toISOString() },
        { country: "Indonesia", action: "checking hotel in Dili", route: "DIL", time: new Date().toISOString() },
        { country: "Australia", action: "visa inquiry", route: "AUS→TL", time: new Date().toISOString() },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  }

  if (path === "/admin/ai-status") {
    return new Response(JSON.stringify({
      providers: [
        { name: "Groq (Primary)", status: "online" },
        { name: "Gemini (Backup)", status: "online" },
        { name: "Cerebras (Fallback)", status: "online" },
      ],
      apiCallsToday: 1420, tokenUsageToday: 284000,
      avgLatencyMs: 340, fallbackCount: 12,
      topIntents: [
        { name: "Flight Search", value: 45 },
        { name: "Hotel", value: 20 },
        { name: "Greeting", value: 18 },
        { name: "Visa", value: 10 },
        { name: "Other", value: 7 },
      ],
      rateLimitStatus: [
        { provider: "Groq", used: 42 },
        { provider: "Gemini", used: 18 },
        { provider: "Cerebras", used: 8 },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  }

  // Forward other admin calls to admin worker
  try {
    const targetUrl = `${adminUrl}${path}${url.search}`;
    const proxyReq  = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });
    const response = await fetch(proxyReq);
    const newH     = new Headers(response.headers);
    Object.entries(CORS).forEach(([k, v]) => newH.set(k, v));
    return new Response(response.body, { status: response.status, headers: newH });
  } catch {
    return new Response(JSON.stringify({ error: "Admin proxy error" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
