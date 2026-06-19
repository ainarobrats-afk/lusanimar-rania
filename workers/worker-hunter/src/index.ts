// ============================================================================
// RANIA V2.1 — Worker Hunter (Flight + Hotel Search)
// The Safe Ghost Engine
//
// POST /api/search    — Search flights from all sources
// GET  /api/health    — Health check
//
// IRON RULE #4: ALL prices MUST come from real API.
// If no API returns data → "Data penerbangan tidak tersedia"
// ============================================================================

import { TravelPayoutsAdapter } from "./adapters/travelpayouts";

// ─── Environment ─────────────────────────────────────────────────────────────

interface Env {
  TRAVELPAYOUTS_TOKEN: string;
  TRAVELPAYOUTS_MARKER: string;
  AVIATIONSTACK_KEY: string;
}

// ─── Unified Flight Result ───────────────────────────────────────────────────

interface UnifiedFlight {
  id: string;
  source: "travelport" | "trip" | "travelpayouts";
  airline: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  taxes: number;
  fees: number;
  totalPrice: number;
  available: boolean;
  lastUpdated: string;
}

// ─── CORS Helpers ────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ─── Search Handler ──────────────────────────────────────────────────────────

async function handleSearch(request: Request, env: Env): Promise<Response> {
  let body: {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
    cabinClass?: string;
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return jsonResp({ error: "Invalid JSON body" }, 400);
  }

  const { origin, destination, departureDate, passengers = 1, cabinClass } = body;

  if (!origin || !destination || !departureDate) {
    return jsonResp(
      { error: "Missing required fields: origin, destination, departureDate" },
      400
    );
  }

  // Accept any 2-4 letter IATA-like code — API decides if it's valid
  if (!/^[A-Z]{2,4}$/i.test(origin) || !/^[A-Z]{2,4}$/i.test(destination)) {
    return jsonResp(
      { error: "Origin and destination must be airport codes (2-4 letters)" },
      400
    );
  }

  const originUpper = origin.toUpperCase();
  const destUpper = destination.toUpperCase();
  const now = new Date().toISOString();

  // Query ONLY Travelpayouts — Travelport is disabled (no real API credentials yet)
  // Master Plan v2.1: DILARANG hardcode harga atau mock prices
  const travelpayouts = new TravelPayoutsAdapter({
    token: env.TRAVELPAYOUTS_TOKEN || "",
    marker: env.TRAVELPAYOUTS_MARKER || "",
  });

  const tpayResult = await Promise.allSettled([
    travelpayouts.searchFlights(originUpper, destUpper, departureDate),
  ]);

  const tpayResults = tpayResult[0];

  // Normalize results
  const allFlights: UnifiedFlight[] = [];
  const sources: string[] = [];

  // TravelPayouts results only
  if (tpayResults.status === "fulfilled" && tpayResults.value.length > 0) {
    sources.push("travelpayouts");
    for (const f of tpayResults.value) {
      allFlights.push({
        id: f.id,
        source: "travelpayouts",
        airline: f.airline,
        airlineCode: f.airlineCode,
        flightNumber: f.flightNumber,
        from: f.from,
        to: f.to,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        duration: f.duration,
        price: f.price,
        currency: f.currency,
        taxes: f.taxes,
        fees: f.fees,
        totalPrice: f.totalPrice,
        available: f.available,
        lastUpdated: now,
      });
    }
  }

  // Sort by total price (cheapest first)
  allFlights.sort((a, b) => a.totalPrice - b.totalPrice);

  // IRON RULE #4: If no results, return "Data tidak tersedia"
  // Always return flights: [] so frontend can render "No flights" card
  if (allFlights.length === 0) {
    return jsonResp({
      error: "DATA_UNAVAILABLE",
      message: "Data penerbangan tidak tersedia untuk rute dan tanggal tersebut.",
      results: [],
      flights: [],   // alias for frontend compatibility
      totalResults: 0,
      sources,
    }, 404);
  }

  return jsonResp({
    results: allFlights,
    flights: allFlights,   // alias — frontend expects "flights" key
    totalResults: allFlights.length,
    sources,
    searchId: `srch-${Date.now().toString(36)}`,
    cachedAt: now,
  });
}

// ─── Worker Export ───────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (request.method === "GET" && url.pathname === "/api/health") {
      return jsonResp({
        status: "ok",
        worker: "rania-hunter",
        version: "2.1.0",
        sources: {
          travelport: !!env.TRAVELPORT_API_KEY ? "configured" : "mock",
          travelpayouts: !!env.TRAVELPAYOUTS_TOKEN ? "configured" : "disabled",
          trip: !!env.TRIP_API_KEY ? "configured" : "disabled",
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Search endpoint
    if (request.method === "POST" && url.pathname === "/api/search") {
      try {
        return await handleSearch(request, env);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal error";
        console.error("Search handler error:", msg);
        return jsonResp({ error: "Internal server error" }, 500);
      }
    }

    // 404
    return jsonResp({ error: "Not Found", path: url.pathname }, 404);
  },
};
