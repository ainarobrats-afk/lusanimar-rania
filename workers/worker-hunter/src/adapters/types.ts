// ============================================================================
// RANIA — Flight Provider Interface
// Semua provider (Travelport, Travelpayouts, AviationStack) harus
// mengimplementasikan interface ini agar bisa dipakai oleh worker-hunter.
// ============================================================================

// ─── Query ───────────────────────────────────────────────────────────────────

export interface FlightQuery {
  origin:        string;   // IATA e.g. "DIL"
  destination:   string;   // IATA e.g. "DPS"
  departureDate: string;   // YYYY-MM-DD
  returnDate?:   string;   // YYYY-MM-DD (optional, for round-trip)
  passengers?:   number;   // default 1
  cabinClass?:   string;   // "Economy" | "Business" | "First"
}

// ─── Unified Flight (RANIA internal schema) ──────────────────────────────────

export interface UnifiedFlight {
  id:            string;
  source:        "travelport" | "travelpayouts" | "aviationstack";
  airline:       string;
  airlineCode:   string;
  flightNumber:  string;
  from:          string;
  to:            string;
  departureTime: string;   // ISO 8601
  arrivalTime:   string;   // ISO 8601
  duration:      string;   // e.g. "2h 30m"
  price:         number;   // base fare
  currency:      string;   // ISO 4217
  taxes:         number;
  fees:          number;
  totalPrice:    number;
  available:     boolean;
  stops:         number;   // 0 = nonstop
  cabinClass?:   string;
  baggage?:      string;
  lastUpdated:   string;   // ISO 8601
}

// ─── Provider result ─────────────────────────────────────────────────────────

export interface ProviderResult {
  flights:     UnifiedFlight[];
  source:      string;
  duration_ms: number;
  error?:      string;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface IFlightProvider {
  /** Provider name — used in logs and response metadata */
  readonly name: string;

  /** Returns true if this provider is configured (has required credentials) */
  isAvailable(): boolean;

  /** Search flights. Must never throw — return empty array on any error. */
  searchFlights(query: FlightQuery): Promise<ProviderResult>;
}
