// ============================================================================
// RANIA — Travelport Provider (worker-hunter adapter)
// API: Travelport TripServices JSON API v11
//
// Cloudflare Worker compatible — uses fetch() only, no Node.js APIs.
// Token cached in-memory (per isolate lifetime, typically minutes in CF Workers).
//
// Credential env vars (set via wrangler secret):
//   TRAVELPORT_USERNAME
//   TRAVELPORT_PASSWORD
//   TRAVELPORT_CLIENT_ID
//   TRAVELPORT_CLIENT_SECRET
//   TRAVELPORT_PCC
//   TRAVELPORT_ACCESS_GROUP
//
// JANGAN hardcode nilai credential apapun di sini.
// ============================================================================

import type { IFlightProvider, FlightQuery, UnifiedFlight, ProviderResult } from "./types";

// ─── OAuth endpoints ──────────────────────────────────────────────────────────

const AUTH_URL      = "https://auth.pp.travelport.net/oauth/token";
const SEARCH_URL    = "https://api.pp.travelport.net/11/air/catalog/search/catalogproductofferings";
// Buffer: refresh token 5 minutes before actual expiry
const EXPIRY_BUFFER = 5 * 60 * 1000;

// ─── Travelport Env ───────────────────────────────────────────────────────────

export interface TravelportEnv {
  TRAVELPORT_USERNAME:      string;
  TRAVELPORT_PASSWORD:      string;
  TRAVELPORT_CLIENT_ID:     string;
  TRAVELPORT_CLIENT_SECRET: string;
  TRAVELPORT_PCC:           string;
  TRAVELPORT_ACCESS_GROUP:  string;
}

// ─── Token cache (in-memory, per CF Worker isolate) ──────────────────────────

interface CachedToken {
  access_token: string;
  token_type:   string;
  expires_in:   number;   // seconds, as returned by Travelport
  expiresAt:    number;   // Date.now() + expires_in * 1000
}

// Module-level cache — shared across requests within same CF isolate
let _tokenCache: CachedToken | null = null;

function isTokenValid(t: CachedToken | null): boolean {
  if (!t) return false;
  return Date.now() < (t.expiresAt - EXPIRY_BUFFER);
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

async function fetchToken(env: TravelportEnv): Promise<CachedToken> {
  const basicAuth = btoa(`${env.TRAVELPORT_CLIENT_ID}:${env.TRAVELPORT_CLIENT_SECRET}`);

  const body = new URLSearchParams({
    grant_type: "password",
    username:   env.TRAVELPORT_USERNAME,
    password:   env.TRAVELPORT_PASSWORD,
  });

  const resp = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Travelport OAuth failed [${resp.status}]: ${errText.substring(0, 200)}`);
  }

  const data = await resp.json() as {
    access_token?: string;
    token_type?:   string;
    expires_in?:   number;
  };

  if (!data.access_token) {
    throw new Error("Travelport OAuth: no access_token in response");
  }

  // expires_in must come from Travelport — do not assume any fixed value
  const expiresIn = data.expires_in;
  if (!expiresIn || expiresIn <= 0) {
    throw new Error(
      `Travelport OAuth: invalid expires_in=${expiresIn}. ` +
      "Cannot cache token without knowing real expiry."
    );
  }

  const token: CachedToken = {
    access_token: data.access_token,
    token_type:   data.token_type ?? "Bearer",
    expires_in:   expiresIn,
    expiresAt:    Date.now() + expiresIn * 1000,
  };

  console.log(
    `[Travelport] Token OK — type: ${token.token_type}, ` +
    `expires_in: ${token.expires_in}s (${(token.expires_in / 3600).toFixed(2)}h)`
  );

  return token;
}

async function getToken(env: TravelportEnv): Promise<string> {
  if (isTokenValid(_tokenCache)) {
    return _tokenCache!.access_token;
  }
  _tokenCache = await fetchToken(env);
  return _tokenCache.access_token;
}

// ─── Request body builder ─────────────────────────────────────────────────────

function buildSearchBody(query: FlightQuery, pcc: string, accessGroup: string): object {
  const cabinCodeMap: Record<string, string> = {
    Economy:          "Y",
    Business:         "C",
    First:            "F",
    "Premium Economy": "W",
  };
  const cabinCode = cabinCodeMap[query.cabinClass ?? "Economy"] ?? "Y";
  const pax       = Math.max(1, Math.min(9, query.passengers ?? 1));

  return {
    CatalogProductOfferingsRequest: {
      "@type": "CatalogProductOfferingsRequestAir",
      travelAgency: {
        "@type":         "TravelAgencyDetail",
        pseudoCityCode:  pcc,
      },
      accessGroup,
      maxNumberOfUpsellsToReturn: 1,
      offersPerPage: 10,
      contentSourceList: ["GDS"],
      SearchCriteriaFlight: [
        {
          "@type":       "SearchCriteriaFlight",
          departureDate: query.departureDate,
          From:          { value: query.origin },
          To:            { value: query.destination },
        },
      ],
      PassengerCriteria: Array.from({ length: pax }, () => ({
        "@type":             "PassengerCriteria",
        number:              1,
        passengerTypeCode:   "ADT",
      })),
      SearchModifiersAir: {
        "@type": "SearchModifiersAir",
        CabinPreference: [
          {
            "@type":         "CabinPreference",
            cabinCode,
            preferenceType:  "Preferred",
          },
        ],
      },
    },
  };
}

// ─── Response parser ──────────────────────────────────────────────────────────

interface TpFlight {
  carrier:     string;
  number:      string;
  origin:      string;
  destination: string;
  departure:   string;
  arrival:     string;
  duration:    string;
  stops:       number;
}

function parseDuration(raw: string): string {
  if (!raw) return "";
  // ISO duration: PT2H30M → "2h 30m"
  const m = raw.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (m) {
    const h = m[1] ? `${m[1]}h ` : "";
    const min = m[2] ? `${m[2]}m` : "";
    return (h + min).trim();
  }
  return raw;
}

function calcDuration(dep: string, arr: string): string {
  try {
    const diff = new Date(arr).getTime() - new Date(dep).getTime();
    if (diff <= 0) return "";
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  } catch { return ""; }
}

function parseResponse(
  data: Record<string, unknown>,
  query: FlightQuery,
): UnifiedFlight[] {
  const now = new Date().toISOString();

  // ── Extract ReferenceList ────────────────────────────────────────────────
  const flightsMap:  Record<string, TpFlight>  = {};
  const productsMap: Record<string, { flightRefs: string[]; cabin: string }> = {};

  const refList = (data.CatalogProductOfferingsResponse as Record<string, unknown> | undefined)
    ?.ReferenceList as Array<Record<string, unknown>> | undefined
    ?? (data.ReferenceList as Array<Record<string, unknown>> | undefined);

  if (Array.isArray(refList)) {
    for (const ref of refList) {
      // Flights
      const rfl = (ref.ReferenceListFlight ?? ref.referenceListFlight) as Record<string, unknown> | undefined;
      if (rfl) {
        const arr = (rfl.Flight ?? rfl.flight) as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(arr)) {
          for (const f of arr) {
            const id  = String(f.id ?? "");
            const dep = f.Departure as Record<string, unknown> | undefined
                        ?? f.departure as Record<string, unknown> | undefined;
            const arr2 = f.Arrival as Record<string, unknown> | undefined
                         ?? f.arrival as Record<string, unknown> | undefined;
            if (id) {
              flightsMap[id] = {
                carrier:     String(f.carrier ?? f.Carrier ?? ""),
                number:      String(f.number  ?? f.Number  ?? ""),
                origin:      String(dep?.airport ?? dep?.Airport ?? f.origin ?? ""),
                destination: String(arr2?.airport ?? arr2?.Airport ?? f.destination ?? ""),
                departure:   String(dep?.dateTime  ?? dep?.dateTime ?? f.departureTime ?? ""),
                arrival:     String(arr2?.dateTime ?? arr2?.dateTime ?? f.arrivalTime ?? ""),
                duration:    parseDuration(String(f.duration ?? "")),
                stops:       Number(f.stops ?? 0),
              };
            }
          }
        }
      }

      // Products
      const rpr = (ref.ReferenceListProduct ?? ref.referenceListProduct) as Record<string, unknown> | undefined;
      if (rpr) {
        const products = (rpr.Product ?? rpr.product) as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(products)) {
          for (const p of products) {
            const id        = String(p.id ?? "");
            const paxFlight = (p.PassengerFlight ?? p.passengerFlight) as
              Array<Record<string, unknown>> | Record<string, unknown> | undefined;
            const cabin = String(
              (Array.isArray(paxFlight) ? paxFlight[0] : paxFlight as Record<string, unknown> | undefined)
                ?.cabin ?? p.cabin ?? "Economy"
            );
            const flightRefs: string[] = [];
            const extractRefs = (obj: Record<string, unknown>) => {
              const refs = (obj.FlightRef ?? obj.flightRef) as
                Array<Record<string, unknown>> | Record<string, unknown> | undefined;
              if (Array.isArray(refs)) refs.forEach(r => flightRefs.push(String(r.value ?? r.ref ?? "")));
              else if (refs) flightRefs.push(String((refs as Record<string, unknown>).value ?? ""));
            };
            if (Array.isArray(paxFlight)) paxFlight.forEach(extractRefs);
            else if (paxFlight) extractRefs(paxFlight as Record<string, unknown>);
            if (id) productsMap[id] = { flightRefs, cabin };
          }
        }
      }
    }
  }

  // ── Extract offers from CatalogProductOfferings ───────────────────────────
  const top = (data.CatalogProductOfferingsResponse ?? data) as Record<string, unknown>;
  const cpoTop = (top.CatalogProductOfferings ?? top.catalogProductOfferings) as Record<string, unknown> | undefined;
  const cpoArray = cpoTop
    ? ((cpoTop.CatalogProductOffering ?? cpoTop.catalogProductOffering) as Array<Record<string, unknown>> | undefined)
    : undefined;

  if (!Array.isArray(cpoArray)) return [];

  const results: UnifiedFlight[] = [];

  for (const cpo of cpoArray) {
    const cpoId = String(cpo.id ?? "");
    const pbos = (cpo.ProductBrandOffering ?? cpo.productBrandOffering) as
      Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(pbos)) continue;

    for (const pbo of pbos) {
      // Price in BestCombinablePrice (required as of v25.11)
      const bcp = (pbo.BestCombinablePrice ?? pbo.bestCombinablePrice ??
                   pbo.Price ?? pbo.price) as Record<string, unknown> | undefined;
      if (!bcp) continue;

      const currency   = String(bcp.currency ?? bcp.Currency ?? "USD");
      const basePrice  = Number(bcp.BasePrice  ?? bcp.basePrice  ?? bcp.base  ?? 0);
      const taxPrice   = Number(bcp.TaxPrice   ?? bcp.taxPrice   ?? bcp.taxes ?? 0);
      const totalPrice = Number(bcp.TotalPrice ?? bcp.totalPrice ?? bcp.total ?? (basePrice + taxPrice));

      // Product reference
      const pRefs = (pbo.ProductRef ?? pbo.productRef) as
        Array<Record<string, unknown>> | Record<string, unknown> | undefined;
      let productRef = "";
      if (Array.isArray(pRefs) && pRefs.length > 0) {
        productRef = String(pRefs[0].value ?? pRefs[0].id ?? "");
      } else if (pRefs) {
        productRef = String((pRefs as Record<string, unknown>).value ?? "");
      }
      if (!productRef) continue;

      const product = productsMap[productRef];
      if (!product) continue;

      // Build flight details from segments
      const segments = product.flightRefs.map(r => flightsMap[r]).filter(Boolean);
      if (segments.length === 0) continue;

      const first = segments[0];
      const last  = segments[segments.length - 1];
      const stops = Math.max(0, segments.length - 1);

      // Duration: prefer from flight data, fallback to calculate
      const duration = first.duration
        || calcDuration(first.departure, last.arrival)
        || "";

      const airlineCode = first.carrier;
      const flightNum   = segments.map(s => `${s.carrier}${s.number}`).join(" / ");

      results.push({
        id:            `tp-${cpoId}-${productRef}`,
        source:        "travelport",
        airline:       airlineCode,
        airlineCode,
        flightNumber:  flightNum,
        from:          first.origin      || query.origin,
        to:            last.destination  || query.destination,
        departureTime: first.departure,
        arrivalTime:   last.arrival,
        duration,
        price:         basePrice || totalPrice,
        currency,
        taxes:         taxPrice,
        fees:          0,
        totalPrice,
        available:     true,
        stops,
        cabinClass:    product.cabin || "Economy",
        lastUpdated:   now,
      });
    }
  }

  return results.sort((a, b) => a.totalPrice - b.totalPrice);
}

// ─── TravelportProvider ───────────────────────────────────────────────────────

export class TravelportProvider implements IFlightProvider {
  readonly name = "travelport";

  constructor(private readonly env: TravelportEnv) {}

  isAvailable(): boolean {
    return !!(
      this.env.TRAVELPORT_USERNAME &&
      this.env.TRAVELPORT_PASSWORD &&
      this.env.TRAVELPORT_CLIENT_ID &&
      this.env.TRAVELPORT_CLIENT_SECRET &&
      this.env.TRAVELPORT_PCC &&
      this.env.TRAVELPORT_ACCESS_GROUP
    );
  }

  async searchFlights(query: FlightQuery): Promise<ProviderResult> {
    const start = Date.now();
    if (!this.isAvailable()) {
      return {
        flights:     [],
        source:      this.name,
        duration_ms: 0,
        error:       "Travelport credentials not configured",
      };
    }

    try {
      const token = await getToken(this.env);

      const body = buildSearchBody(
        query,
        this.env.TRAVELPORT_PCC,
        this.env.TRAVELPORT_ACCESS_GROUP,
      );

      const headers: Record<string, string> = {
        "Authorization":                   `Bearer ${token}`,
        "Content-Type":                    "application/json",
        "Accept":                          "application/json",
        "XAUTH-TRAVELPORT-ACCESSGROUP":    this.env.TRAVELPORT_ACCESS_GROUP,
        "XAUTH-TRAVELPORT-PCC":            this.env.TRAVELPORT_PCC,
      };

      let resp = await fetch(SEARCH_URL, {
        method:  "POST",
        headers,
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(30_000),
      });

      // 401 → retry once with fresh token
      if (resp.status === 401) {
        console.warn("[Travelport] 401 — refreshing token and retrying");
        _tokenCache = null;
        const freshToken = await getToken(this.env);
        headers["Authorization"] = `Bearer ${freshToken}`;
        resp = await fetch(SEARCH_URL, {
          method:  "POST",
          headers,
          body:    JSON.stringify(body),
          signal:  AbortSignal.timeout(30_000),
        });
      }

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        return {
          flights:     [],
          source:      this.name,
          duration_ms: Date.now() - start,
          error:       `Travelport search [${resp.status}]: ${errText.substring(0, 300)}`,
        };
      }

      const data    = await resp.json() as Record<string, unknown>;
      const flights = parseResponse(data, query);

      console.log(
        `[Travelport] ${query.origin}→${query.destination} ${query.departureDate}: ` +
        `${flights.length} flights in ${Date.now() - start}ms`
      );

      return { flights, source: this.name, duration_ms: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Travelport] Error:", msg);
      return {
        flights:     [],
        source:      this.name,
        duration_ms: Date.now() - start,
        error:       msg,
      };
    }
  }
}
