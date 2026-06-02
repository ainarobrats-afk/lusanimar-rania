import cron from "node-cron";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { logger } from "../lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.resolve(__dirname, "../../data/flight-cache.json");

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface FlightCacheEntry {
  price: number;
  currency: string;
  airline: string;
  route: string;
  cachedAt: string;
  source: "travelpayouts-latest" | "travelpayouts-matrix" | "cerebras-analyst" | "fallback";
  departDate?: string;
  note?: string;
}

export type FlightCache = Record<string, FlightCacheEntry>;

// ─── Route Definitions ─────────────────────────────────────────────────────────
// Based on Luis Sanimar's verified airline list (Dili, Timor-Leste)
// Air Timor EXCLUDED (ceased Dec 2023). Citilink EXCLUDED (no DIL routes).
const DIL_ROUTES = [
  {
    from: "DIL", to: "DPS",
    label: "Dili → Bali (Denpasar)",
    airlines: ["Aero Dili (4W) — direct DIL–DPS", "Garuda Indonesia (GA) via connecting"],
    website: "https://www.aerodili.com",
    fallbackPrice: 180, fallbackAirline: "Aero Dili",
  },
  {
    from: "DIL", to: "DRW",
    label: "Dili → Darwin",
    airlines: ["Airnorth — direct DIL–DRW", "Virgin Australia via DPS"],
    website: "https://www.airnorth.com.au",
    fallbackPrice: 95, fallbackAirline: "Airnorth",
  },
  {
    from: "DIL", to: "SIN",
    label: "Dili → Singapore",
    airlines: ["Aero Dili via DPS + Singapore Airlines (SQ)", "Garuda Indonesia (GA) via CGK", "Batik Air via CGK"],
    website: "https://www.singaporeair.com",
    fallbackPrice: 280, fallbackAirline: "Aero Dili + Singapore Airlines",
  },
  {
    from: "DIL", to: "CGK",
    label: "Dili → Jakarta",
    airlines: ["Garuda Indonesia (GA) via DPS", "Batik Air (ID) via DPS or UPG", "Lion Air (JT) via DPS"],
    website: "https://www.garuda-indonesia.com",
    fallbackPrice: 200, fallbackAirline: "Garuda Indonesia",
  },
  {
    from: "DIL", to: "KUL",
    label: "Dili → Kuala Lumpur",
    airlines: ["AirAsia (AK) via DPS or CGK", "Malaysia Airlines (MH) via SIN or CGK", "Aero Dili via DPS + AirAsia"],
    website: "https://www.airasia.com",
    fallbackPrice: 280, fallbackAirline: "AirAsia",
  },
  {
    from: "DIL", to: "SYD",
    label: "Dili → Sydney",
    airlines: ["Qantas (QF) via DPS or DRW", "Jetstar (JQ) via DPS", "Virgin Australia via DRW"],
    website: "https://www.qantas.com",
    fallbackPrice: 450, fallbackAirline: "Qantas",
  },
  {
    from: "DIL", to: "LHR",
    label: "Dili → London Heathrow",
    airlines: ["Qatar Airways (QR) via DOH", "Emirates (EK) via DXB", "Etihad via AUH + Garuda/Aero Dili from DIL"],
    website: "https://www.qatarairways.com",
    fallbackPrice: 1200, fallbackAirline: "Qatar Airways",
  },
  {
    from: "DIL", to: "XMN",
    label: "Dili → Xiamen",
    airlines: ["Aero Dili (4W) — direct DIL–XMN", "Xiamen Airlines (MF) via connecting"],
    website: "https://www.aerodili.com",
    fallbackPrice: 380, fallbackAirline: "Aero Dili",
  },
  {
    from: "DIL", to: "OEC",
    label: "Dili → Oecusse (Oe-Cusse Ambeno)",
    airlines: ["Aero Dili (4W) — only commercial option, small prop aircraft", "charter / ZEESM gov flights"],
    website: "https://www.aerodili.com",
    fallbackPrice: 45, fallbackAirline: "Aero Dili",
  },
  {
    from: "DIL", to: "NRT",
    label: "Dili → Tokyo (Narita)",
    airlines: ["Qatar Airways (QR) via Doha (DOH)", "Emirates (EK) via Dubai (DXB)", "Singapore Airlines (SQ) via Singapore (SIN)", "Japan Airlines (JL) via Singapore (SIN)", "ANA All Nippon Airways (NH) via Singapore (SIN)"],
    website: "https://www.qatarairways.com",
    fallbackPrice: 750, fallbackAirline: "Qatar Airways",
  },
  {
    from: "DIL", to: "MEL",
    label: "Dili → Melbourne",
    airlines: ["Garuda Indonesia (GA) via Bali (DPS)", "Jetstar (JQ) via Bali (DPS)", "Qantas (QF) via Darwin (DRW) or Bali (DPS)"],
    website: "https://www.qantas.com",
    fallbackPrice: 480, fallbackAirline: "Garuda Indonesia",
  },
  {
    from: "DIL", to: "PER",
    label: "Dili → Perth",
    airlines: ["Qantas (QF) via Darwin (DRW) or Bali (DPS)", "Garuda Indonesia (GA) via Bali (DPS)"],
    website: "https://www.qantas.com",
    fallbackPrice: 420, fallbackAirline: "Qantas",
  },
];

// ─── Gate → Airline Name mapping (Travelpayouts OTA codes) ─────────────────────
const GATE_TO_AIRLINE: Record<string, string> = {
  "Mytrip.com": "Aero Dili",
  "Trip.com": "Garuda Indonesia",
  "City.Travel": "Aero Dili",
  "Kiwi.com": "Multiple airlines",
  "Expedia": "Multiple airlines",
  "Booking.com": "Multiple airlines",
  "eDreams": "Multiple airlines",
  "Opodo": "Multiple airlines",
  "Skyscanner": "Multiple airlines",
};

function resolveAirline(gate: string, routeFrom: string, routeTo: string): string {
  // Try gate mapping first
  if (GATE_TO_AIRLINE[gate]) return GATE_TO_AIRLINE[gate]!;

  // Route-based known airline heuristics
  const key = `${routeFrom}-${routeTo}`;
  const routeAirline: Record<string, string> = {
    "DIL-DPS": "Aero Dili",
    "DIL-DRW": "Airnorth",
    "DIL-SIN": "Singapore Airlines",
    "DIL-CGK": "Garuda Indonesia",
    "DIL-KUL": "AirAsia",
    "DIL-SYD": "Qantas",
    "DIL-LHR": "Qatar Airways",
    "DIL-XMN": "Aero Dili",
    "DIL-OEC": "Aero Dili",
  };
  return routeAirline[key] || gate || "Multiple airlines";
}

// ─── Cache I/O ─────────────────────────────────────────────────────────────────
export function readFlightCache(): FlightCache {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    return JSON.parse(raw) as FlightCache;
  } catch {
    return {};
  }
}

function writeFlightCache(cache: FlightCache): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch (err: any) {
    logger.error({ err }, "Failed to write flight cache");
  }
}

export function isCacheFresh(entry: FlightCacheEntry, maxAgeHours = 12): boolean {
  const cachedAt = new Date(entry.cachedAt).getTime();
  return Date.now() - cachedAt < maxAgeHours * 60 * 60 * 1000;
}

// ─── Source 1: Travelpayouts v2/prices/latest ───────────────────────────────────
async function fetchTravelpayoutsLatest(
  origin: string,
  destination: string,
  token: string
): Promise<{ price: number; airline: string; departDate?: string } | null> {
  try {
    const url = `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&period_type=year&one_way=true&limit=5&token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data: any = await res.json();
    const items: any[] = data?.data || [];
    if (!items.length) return null;

    // Sort by price ascending, filter only actual tickets
    const valid = items.filter((x: any) => x.actual && x.value > 0);
    if (!valid.length) return null;
    const cheapest = valid.reduce((a: any, b: any) => (a.value < b.value ? a : b));
    const airline = resolveAirline(cheapest.gate || "", origin, destination);
    return { price: cheapest.value, airline, departDate: cheapest.depart_date };
  } catch {
    return null;
  }
}

// ─── Source 2: Travelpayouts v2/prices/month-matrix ───────────────────────────
async function fetchTravelpayoutsMonthMatrix(
  origin: string,
  destination: string,
  token: string
): Promise<{ price: number; airline: string; departDate?: string } | null> {
  try {
    // Try next 2 months
    const now = new Date();
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const url = `https://api.travelpayouts.com/v2/prices/month-matrix?origin=${origin}&destination=${destination}&currency=usd&month=${month}&token=${token}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const data: any = await res.json();
      const items: any[] = data?.data || [];
      if (!items.length) continue;
      const valid = items.filter((x: any) => x.value > 0);
      if (!valid.length) continue;
      const cheapest = valid.reduce((a: any, b: any) => (a.value < b.value ? a : b));
      const airline = resolveAirline(cheapest.gate || "", origin, destination);
      return { price: cheapest.value, airline, departDate: cheapest.depart_date };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Source 3: Cerebras AI Price Analyst ───────────────────────────────────────
// Used when Travelpayouts has no coverage (routes like DIL-DRW, DIL-SIN, DIL-OEC)
// Cerebras gpt-oss-120b is used as a fast price analyst with flight market knowledge.
// This is a reasoning model (46ms avg response) — requires max_tokens >= 2000 to
// allow it to complete its internal reasoning chain before emitting content.
async function fetchCerebrasPrice(
  route: typeof DIL_ROUTES[0]
): Promise<{ price: number; airline: string; note: string } | null> {
  const key = process.env.CEREBRAS_KEY;
  if (!key) return null;

  const airlinesStr = route.airlines.join(", ");
  const prompt = `You are an expert flight price analyst for Sanimar Travel in Dili, Timor-Leste.

Route: ${route.from} → ${route.to} (${route.label})
Known operating airlines: ${airlinesStr}

Estimate the CHEAPEST available one-way economy fare in USD for this route (May/June 2026).
Air Timor has CEASED operations (Dec 2023). Citilink does NOT operate from DIL.
Consider connecting flights, seasonal pricing (dry season May-June), and current market rates.

Reply ONLY with this JSON and nothing else:
{"price": NUMBER, "airline": "AIRLINE NAME", "note": "brief routing note"}`;

  // Retry up to 3 times with exponential backoff — Cerebras has per-minute rate limits
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-oss-120b",
          messages: [
            { role: "system", content: "You are a flight price analyst. Reply ONLY with valid JSON, no markdown, no extra text." },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429) {
        const retryAfter = attempt * 8; // 8s, 16s, 24s
        logger.warn({ route: `${route.from}-${route.to}`, attempt, retryAfter }, "Cerebras rate limited — waiting to retry");
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      if (!res.ok) {
        logger.warn({ route: `${route.from}-${route.to}`, status: res.status }, "Cerebras API error");
        return null;
      }

      const data: any = await res.json();
      const text: string = data?.choices?.[0]?.message?.content?.trim() || "";
      if (!text) return null;

      // Extract JSON from response (handles cases where model wraps in markdown)
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.price || typeof parsed.price !== "number" || parsed.price <= 0) return null;

      logger.info({ route: `${route.from}-${route.to}`, price: parsed.price, airline: parsed.airline, attempt }, "🧠 Cerebras analyst complete");
      return { price: Math.round(parsed.price), airline: parsed.airline || route.fallbackAirline, note: parsed.note || "" };

    } catch (err: any) {
      if (attempt === 3) {
        logger.warn({ route: `${route.from}-${route.to}`, err: err?.message }, "Cerebras price fetch failed after retries");
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
  }
  return null;
}

// ─── Cerebras Post-fetch Validation ───────────────────────────────────────────
// After fetching real prices, use Cerebras to validate and log suspicious prices
async function cerebrasValidatePrice(
  routeLabel: string,
  price: number,
  airline: string,
  source: string
): Promise<void> {
  const key = process.env.CEREBRAS_KEY;
  if (!key) return;

  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          { role: "system", content: "Flight price validator for RANIA Travel AI. Respond in 1 concise sentence." },
          { role: "user", content: `Route: ${routeLabel}. Price: $${price} via ${airline} (source: ${source}). Is this within normal market range for May 2026? Flag if suspicious.` },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return;
    const data: any = await res.json();
    const verdict: string = data?.choices?.[0]?.message?.content?.trim() || "";
    if (verdict) logger.info({ routeLabel, price, airline, verdict }, "🦉 Cerebras price validation");
  } catch {
    // Silent — validation is best-effort
  }
}

// ─── Main Fetch Orchestrator ───────────────────────────────────────────────────
export async function fetchAllFlightPrices(): Promise<FlightCache> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const cache: FlightCache = readFlightCache();
  const now = new Date().toISOString();

  const stats = { travelpayoutsLatest: 0, travelpayoutsMatrix: 0, cerebrasAnalyst: 0, fallback: 0 };

  logger.info("🦉 Burung Hantu RANIA: starting nightly multi-source price fetch...");
  logger.info({ routes: DIL_ROUTES.length, hasTravelpayoutsToken: !!token, hasCerebrasKey: !!process.env.CEREBRAS_KEY }, "🦉 Fetch config");

  for (const route of DIL_ROUTES) {
    const key = `${route.from}-${route.to}`;
    let entry: FlightCacheEntry | null = null;

    // ── Source 1: Travelpayouts v2/prices/latest ──────────────────────────────
    if (token && !entry) {
      const result = await fetchTravelpayoutsLatest(route.from, route.to, token);
      if (result) {
        entry = {
          price: result.price, currency: "USD", airline: result.airline,
          route: key, cachedAt: now, source: "travelpayouts-latest",
          departDate: result.departDate,
          note: `Real price from Travelpayouts (depart: ${result.departDate || "flexible"})`,
        };
        stats.travelpayoutsLatest++;
        logger.info({ route: key, price: result.price, airline: result.airline, source: "travelpayouts-latest" }, "✅ Price from Travelpayouts latest");
        // Validate with Cerebras (async, non-blocking)
        cerebrasValidatePrice(route.label, result.price, result.airline, "travelpayouts-latest").catch(() => {});
      }
    }

    // ── Source 2: Travelpayouts v2/prices/month-matrix ────────────────────────
    if (token && !entry) {
      await new Promise((r) => setTimeout(r, 300)); // Brief pause between API calls
      const result = await fetchTravelpayoutsMonthMatrix(route.from, route.to, token);
      if (result) {
        entry = {
          price: result.price, currency: "USD", airline: result.airline,
          route: key, cachedAt: now, source: "travelpayouts-matrix",
          departDate: result.departDate,
          note: `Real price from Travelpayouts month-matrix (depart: ${result.departDate || "flexible"})`,
        };
        stats.travelpayoutsMatrix++;
        logger.info({ route: key, price: result.price, airline: result.airline, source: "travelpayouts-matrix" }, "✅ Price from Travelpayouts month-matrix");
        cerebrasValidatePrice(route.label, result.price, result.airline, "travelpayouts-matrix").catch(() => {});
      }
    }

    // ── Source 3: Cerebras AI Price Analyst ──────────────────────────────────
    // For routes not covered by Travelpayouts (especially Aero Dili exclusive routes
    // like DIL-OEC, and routes in markets underrepresented in Travelpayouts data)
    if (!entry) {
      await new Promise((r) => setTimeout(r, 300));
      const result = await fetchCerebrasPrice(route);
      if (result) {
        entry = {
          price: result.price, currency: "USD", airline: result.airline,
          route: key, cachedAt: now, source: "cerebras-analyst",
          note: result.note,
        };
        stats.cerebrasAnalyst++;
        logger.info({ route: key, price: result.price, airline: result.airline, source: "cerebras-analyst" }, "🧠 Price from Cerebras analyst");
      }
    }

    // ── Source 4: Hardcoded Fallback ──────────────────────────────────────────
    if (!entry) {
      entry = {
        price: route.fallbackPrice, currency: "USD", airline: route.fallbackAirline,
        route: key, cachedAt: now, source: "fallback",
        note: "Estimated reference price — contact Sanimar Travel for current fares",
      };
      stats.fallback++;
      logger.warn({ route: key }, "⚠️  Using hardcoded fallback price");
    }

    cache[key] = entry;

    // Delay between routes — longer when Cerebras was used (rate limit: ~10 req/min)
    const delay = (entry.source === "cerebras-analyst") ? 6000 : 500;
    await new Promise((r) => setTimeout(r, delay));
  }

  writeFlightCache(cache);
  logger.info(
    {
      ...stats,
      total: DIL_ROUTES.length,
      cached: Object.keys(cache).length,
    },
    "🦉 Nightly price fetch complete — cache updated"
  );

  return cache;
}

// ─── Single Route Fetch (for Admin Dashboard manual refresh) ──────────────────
export async function fetchRoutePrice(routeKey: string): Promise<FlightCacheEntry | null> {
  const route = DIL_ROUTES.find((r) => `${r.from}-${r.to}` === routeKey);
  if (!route) return null;

  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const now = new Date().toISOString();
  let entry: FlightCacheEntry | null = null;

  if (token) {
    const r1 = await fetchTravelpayoutsLatest(route.from, route.to, token);
    if (r1) {
      entry = { price: r1.price, currency: "USD", airline: r1.airline, route: routeKey, cachedAt: now, source: "travelpayouts-latest", departDate: r1.departDate, note: `Real price from Travelpayouts (depart: ${r1.departDate || "flexible"})` };
    }
    if (!entry) {
      const r2 = await fetchTravelpayoutsMonthMatrix(route.from, route.to, token);
      if (r2) {
        entry = { price: r2.price, currency: "USD", airline: r2.airline, route: routeKey, cachedAt: now, source: "travelpayouts-matrix", departDate: r2.departDate, note: `Real price from Travelpayouts month-matrix` };
      }
    }
  }
  if (!entry) {
    const r3 = await fetchCerebrasPrice(route);
    if (r3) {
      entry = { price: r3.price, currency: "USD", airline: r3.airline, route: routeKey, cachedAt: now, source: "cerebras-analyst", note: r3.note };
    }
  }
  if (!entry) {
    entry = { price: route.fallbackPrice, currency: "USD", airline: route.fallbackAirline, route: routeKey, cachedAt: now, source: "fallback", note: "Estimated reference price — contact Sanimar Travel for current fares" };
  }

  // Patch into existing cache
  const cache = readFlightCache();
  cache[routeKey] = entry;
  writeFlightCache(cache);
  logger.info({ route: routeKey, price: entry.price, source: entry.source }, "🦉 Single route refresh complete");
  return entry;
}

// ─── Cron Scheduler ────────────────────────────────────────────────────────────
export function startPriceFetcherCron(): void {
  // Run every day at 01:00 AM server time (Dili is UTC+9, so this is ~10:00 AM Dili)
  cron.schedule("0 1 * * *", async () => {
    logger.info("🦉 Cron triggered: nightly Burung Hantu flight price fetch");
    await fetchAllFlightPrices();
  });

  logger.info("🦉 Burung Hantu price fetcher scheduled: daily at 01:00 AM");

  // Also run on startup if cache is empty or stale
  setTimeout(async () => {
    const cache = readFlightCache();
    const keys = Object.keys(cache);
    if (!keys.length) {
      logger.info("🦉 Cache empty on startup — running initial Burung Hantu fetch");
      await fetchAllFlightPrices();
      return;
    }
    // Check if any entry is stale
    const anyStale = keys.some((k) => cache[k] && !isCacheFresh(cache[k]!, 12));
    if (anyStale) {
      logger.info("🦉 Stale cache detected on startup — refreshing prices");
      await fetchAllFlightPrices();
    } else {
      const entry = cache[keys[0]!];
      logger.info({ cachedAt: entry?.cachedAt, source: entry?.source }, "🦉 Cache fresh — skipping startup fetch");
    }
  }, 5000);
}
