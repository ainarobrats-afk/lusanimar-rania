// ============================================================================
// RANIA — Travelpayouts Provider (worker-hunter adapter)
// ============================================================================

import type { IFlightProvider, FlightQuery, UnifiedFlight, ProviderResult } from "./types";

export interface TravelPayoutsConfig {
  token:  string;
  marker: string;
}

export class TravelPayoutsAdapter implements IFlightProvider {
  readonly name = "travelpayouts";

  constructor(private readonly config: TravelPayoutsConfig) {}

  isAvailable(): boolean {
    return !!this.config.token;
  }

  async searchFlights(query: FlightQuery): Promise<ProviderResult> {
    const start = Date.now();
    if (!this.isAvailable()) {
      return { flights: [], source: this.name, duration_ms: 0, error: "No token" };
    }

    try {
      const { origin, destination, departureDate } = query;
      const flights: UnifiedFlight[] = [];

      // Try endpoints in priority order
      const v1cheap = await this.searchV1Cheap(origin, destination);
      if (v1cheap.length > 0) {
        flights.push(...v1cheap);
      } else {
        const v1cal = await this.searchV1Calendar(origin, destination, departureDate);
        if (v1cal.length > 0) flights.push(...v1cal);
        else {
          const v2 = await this.searchV2Latest(origin, destination);
          flights.push(...v2);
        }
      }

      return { flights, source: this.name, duration_ms: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { flights: [], source: this.name, duration_ms: Date.now() - start, error: msg };
    }
  }

  // ─── v1/prices/cheap ───────────────────────────────────────────────────────

  private async searchV1Cheap(origin: string, destination: string): Promise<UnifiedFlight[]> {
    const url =
      `https://api.travelpayouts.com/v1/prices/cheap` +
      `?origin=${origin}&destination=${destination}&currency=USD&token=${this.config.token}`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Access-Token": this.config.token },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`v1/cheap HTTP ${res.status}`);
    const data = await res.json() as {
      success?: boolean;
      data?: Record<string, Record<string, unknown>>;
    };
    if (!data.success || !data.data) throw new Error("v1/cheap: no data");

    const flights: UnifiedFlight[] = [];
    let idx = 0;
    for (const destEntries of Object.values(data.data)) {
      for (const item of Object.values(destEntries)) {
        const f      = item as Record<string, unknown>;
        const price  = Number(f.price ?? 0);
        if (!price) continue;
        const depTime    = String(f.departure_at ?? "");
        const durationMin = Number(f.duration_to ?? f.duration ?? 120);
        const depDate    = depTime ? new Date(depTime) : new Date();
        // Calculate arrival from departure + duration (not return_at which is return date)
        const arrDate    = new Date(depDate.getTime() + durationMin * 60_000);
        const taxes      = Math.round(price * 0.12);

        flights.push({
          id:            `tpay-cheap-${origin}${destination}-${idx}`,
          source:        "travelpayouts",
          airline:       String(f.airline ?? ""),
          airlineCode:   String(f.airline ?? ""),
          flightNumber:  `${f.airline ?? ""}${f.flight_number ?? idx}`,
          from:          origin,
          to:            destination,
          departureTime: depTime,
          arrivalTime:   arrDate.toISOString(),
          duration:      `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
          price,
          currency:      "USD",
          taxes,
          fees:          8,
          totalPrice:    price + taxes + 8,
          available:     true,
          stops:         0,   // not provided by Travelpayouts v1
          lastUpdated:   new Date().toISOString(),
        });
        idx++;
        if (flights.length >= 5) break;
      }
      if (flights.length >= 5) break;
    }
    if (flights.length === 0) throw new Error("v1/cheap: empty");
    return flights;
  }

  // ─── v1/prices/calendar ────────────────────────────────────────────────────

  private async searchV1Calendar(
    origin: string, destination: string, departureDate: string
  ): Promise<UnifiedFlight[]> {
    const url =
      `https://api.travelpayouts.com/v1/prices/calendar` +
      `?origin=${origin}&destination=${destination}` +
      `&departure_at=${departureDate}&currency=USD&token=${this.config.token}&limit=5`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Access-Token": this.config.token },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`v1/calendar HTTP ${res.status}`);
    const data = await res.json() as { data?: unknown[] };
    if (!data.data?.length) throw new Error("v1/calendar: no data");
    return this.mapV2(data.data as Record<string, unknown>[], origin, destination);
  }

  // ─── v2/prices/latest ──────────────────────────────────────────────────────

  private async searchV2Latest(origin: string, destination: string): Promise<UnifiedFlight[]> {
    const url =
      `https://api.travelpayouts.com/v2/prices/latest` +
      `?origin=${origin}&destination=${destination}&currency=usd` +
      `&token=${this.config.token}&limit=5`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Access-Token": this.config.token },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`v2/latest HTTP ${res.status}`);
    const data = await res.json() as { data?: unknown[] };
    if (!data.data?.length) throw new Error("v2/latest: no data");
    return this.mapV2(data.data as Record<string, unknown>[], origin, destination);
  }

  private mapV2(items: Record<string, unknown>[], origin: string, destination: string): UnifiedFlight[] {
    return items.map((item, idx) => {
      const price  = Number(item.value ?? item.price ?? 0);
      const taxes  = Math.round(price * 0.12);
      return {
        id:            `tpay-${origin}${destination}-${idx}`,
        source:        "travelpayouts" as const,
        airline:       String(item.airline ?? ""),
        airlineCode:   String(item.airline ?? ""),
        flightNumber:  `${item.airline ?? ""}${item.flight_number ?? idx}`,
        from:          origin,
        to:            destination,
        departureTime: String(item.departure_at ?? ""),
        arrivalTime:   String(item.return_at ?? ""),   // acknowledged limitation
        duration:      "N/A",
        price,
        currency:      "USD",
        taxes,
        fees:          8,
        totalPrice:    price + taxes + 8,
        available:     true,
        stops:         0,
        lastUpdated:   new Date().toISOString(),
      };
    });
  }
}
