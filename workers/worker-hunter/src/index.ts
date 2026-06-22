// ============================================================================
// RANIA V3.0 — Worker Hunter (Flight Search)
// The Safe Ghost Engine
//
// POST /api/search    — Search flights (provider auto-selection)
// GET  /api/health    — Health check + provider status
//
// Provider priority:  Travelport → Travelpayouts → AviationStack
//
// IRON RULE #4: ALL prices MUST come from real API.
// If no provider returns data → return empty array, never mock prices.
//
// Credentials managed as Cloudflare Worker secrets (wrangler secret put).
// ============================================================================

import { TravelportProvider }   from "./adapters/travelport";
import { TravelPayoutsAdapter } from "./adapters/travelpayouts";
import type { IFlightProvider, FlightQuery, UnifiedFlight } from "./adapters/types";

// ─── Environment (Cloudflare Worker secrets) ──────────────────────────────────

interface Env {
  // Travelpayouts
  TRAVELPAYOUTS_TOKEN:      string;
  TRAVELPAYOUTS_MARKER:     string;
  // Travelport (set via: wrangler secret put TRAVELPORT_USERNAME --name rania-hunter)
  TRAVELPORT_USERNAME:      string;
  TRAVELPORT_PASSWORD:      string;
  TRAVELPORT_CLIENT_ID:     string;
  TRAVELPORT_CLIENT_SECRET: string;
  TRAVELPORT_PCC:           string;
  TRAVELPORT_ACCESS_GROUP:  string;
  // AviationStack (backup — no pricing, schedule only)
  AVIATIONSTACK_KEY:        string;
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ─── Provider factory ─────────────────────────────────────────────────────────

function buildProviders(env: Env): IFlightProvider[] {
  return [
    // Priority 1: Travelport (GDS — real fares, full flight details)
    new TravelportProvider({
      TRAVELPORT_USERNAME:      env.TRAVELPORT_USERNAME,
      TRAVELPORT_PASSWORD:      env.TRAVELPORT_PASSWORD,
      TRAVELPORT_CLIENT_ID:     env.TRAVELPORT_CLIENT_ID,
      TRAVELPORT_CLIENT_SECRET: env.TRAVELPORT_CLIENT_SECRET,
      TRAVELPORT_PCC:           env.TRAVELPORT_PCC,
      TRAVELPORT_ACCESS_GROUP:  env.TRAVELPORT_ACCESS_GROUP,
    }),

    // Priority 2: Travelpayouts (affiliate API — price data)
    new TravelPayoutsAdapter({
      token:  env.TRAVELPAYOUTS_TOKEN  ?? "",
      marker: env.TRAVELPAYOUTS_MARKER ?? "",
    }),
  ];
}

// ─── Provider auto-selection ──────────────────────────────────────────────────
//
// Strategy: try providers in priority order.
// Return first provider that returns ≥1 flight.
// Fallback to next provider if current fails or returns empty.
//
// This means:
//   - Travelport credentials configured + sandbox working → use Travelport
//   - Travelport not configured / down → fall through to Travelpayouts
//   - Both fail → return empty with error from all providers

interface SearchOutcome {
  flights:      UnifiedFlight[];
  sources:      string[];
  providerUsed: string;
  errors:       Record<string, string>;
  duration_ms:  number;
}

async function searchWithFallback(
  query: FlightQuery,
  providers: IFlightProvider[],
): Promise<SearchOutcome> {
  const start   = Date.now();
  const sources: string[] = [];
  const errors:  Record<string, string> = {};

  for (const provider of providers) {
    if (!provider.isAvailable()) {
      errors[provider.name] = "not configured";
      continue;
    }

    const result = await provider.searchFlights(query);

    if (result.error) {
      errors[provider.name] = result.error;
      console.warn(`[Hunter] ${provider.name} error: ${result.error}`);
      continue;
    }

    if (result.flights.length > 0) {
      sources.push(result.source);
      return {
        flights:      result.flights,
        sources,
        providerUsed: provider.name,
        errors,
        duration_ms:  Date.now() - start,
      };
    }

    // Provider returned 0 results — log and try next
    errors[provider.name] = "no_results";
    console.log(`[Hunter] ${provider.name}: 0 results, trying next provider`);
  }

  return {
    flights:      [],
    sources,
    providerUsed: "none",
    errors,
    duration_ms:  Date.now() - start,
  };
}

// ─── Search handler ───────────────────────────────────────────────────────────

async function handleSearch(req: Request, env: Env): Promise<Response> {
  let body: {
    origin?:        string;
    destination?:   string;
    departureDate?: string;
    returnDate?:    string;
    passengers?:    number;
    cabinClass?:    string;
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { origin, destination, departureDate, passengers = 1, cabinClass = "Economy" } = body;

  if (!origin || !destination || !departureDate) {
    return json({ error: "Missing required: origin, destination, departureDate" }, 400);
  }

  if (!/^[A-Z]{2,4}$/i.test(origin) || !/^[A-Z]{2,4}$/i.test(destination)) {
    return json({ error: "origin and destination must be IATA codes (2-4 letters)" }, 400);
  }

  const query: FlightQuery = {
    origin:        origin.toUpperCase(),
    destination:   destination.toUpperCase(),
    departureDate,
    passengers,
    cabinClass,
  };

  const providers = buildProviders(env);
  const outcome   = await searchWithFallback(query, providers);

  // Sort by price
  outcome.flights.sort((a, b) => a.totalPrice - b.totalPrice);

  // IRON RULE #4 — no results → 404 with clear message, never mock
  if (outcome.flights.length === 0) {
    return json({
      error:        "DATA_UNAVAILABLE",
      message:      "Data penerbangan tidak tersedia untuk rute dan tanggal tersebut.",
      results:      [],
      flights:      [],
      totalResults: 0,
      sources:      outcome.sources,
      providerErrors: outcome.errors,
      duration_ms:  outcome.duration_ms,
    }, 404);
  }

  const now = new Date().toISOString();
  return json({
    results:      outcome.flights,
    flights:      outcome.flights,    // alias — frontend expects "flights" key
    totalResults: outcome.flights.length,
    sources:      outcome.sources,
    providerUsed: outcome.providerUsed,
    searchId:     `srch-${Date.now().toString(36)}`,
    cachedAt:     now,
    duration_ms:  outcome.duration_ms,
  });
}

// ─── Worker export ────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // Health check — includes provider availability status
    if (request.method === "GET" && url.pathname === "/api/health") {
      const providers = buildProviders(env);
      return json({
        status:    "ok",
        worker:    "rania-hunter",
        version:   "3.0.0",
        providers: providers.map(p => ({
          name:        p.name,
          available:   p.isAvailable(),
          priority:    providers.indexOf(p) + 1,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Flight search
    if (request.method === "POST" && url.pathname === "/api/search") {
      try {
        return await handleSearch(request, env);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Internal error";
        console.error("[Hunter] Unhandled error:", msg);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return json({ error: "Not Found", path: url.pathname }, 404);
  },
};
