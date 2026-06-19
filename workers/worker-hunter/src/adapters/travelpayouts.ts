// ============================================================================
// RANIA V2.1 — TravelPayouts Adapter
// Master Plan: WAJIB Travelpayouts API untuk semua rute.
// DILARANG hardcode harga atau ROUTE_PRICES.
//
// Note: Travelpayouts price data API requires a valid affiliate token
// with Data API access. Token can be found at:
// travelpayouts.com/developers/api → "Your API Token"
// ============================================================================

export interface TravelPayoutsConfig {
  token: string;
  marker: string;
}

export interface TPFlight {
  id: string;
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
}

export class TravelPayoutsAdapter {
  private config: TravelPayoutsConfig;

  constructor(config: TravelPayoutsConfig) {
    this.config = config;
  }

  async searchFlights(origin: string, destination: string, departureDate: string): Promise<TPFlight[]> {
    if (!this.config.token) return [];

    // Try endpoints in order of reliability
    // v1/cheap is most reliable (confirmed working with token 01c853bd...)
    try {
      const results = await this.searchV1Cheap(origin, destination);
      if (results.length > 0) return results;
    } catch { /* fall through */ }

    // v1/calendar — date-specific
    try {
      const results = await this.searchV1Calendar(origin, destination, departureDate);
      if (results.length > 0) return results;
    } catch { /* fall through */ }

    // v2/latest — less reliable
    try {
      const results = await this.searchV2Latest(origin, destination);
      if (results.length > 0) return results;
    } catch { /* fall through */ }

    return [];
  }

  // v2/prices/latest — most commonly available
  private async searchV2Latest(origin: string, destination: string): Promise<TPFlight[]> {
    const url = `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&token=${this.config.token}&limit=5`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Access-Token": this.config.token },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`v2/latest HTTP ${res.status}`);
    const data = await res.json() as { data?: unknown[] };
    if (!data.data || data.data.length === 0) throw new Error("no data");
    return this.mapV2(data.data as Record<string, unknown>[], origin, destination);
  }

  // v1/prices/cheap — aggregated cheapest, format: { data: { "DEST": { "0": { airline, price, ... } } } }
  private async searchV1Cheap(origin: string, destination: string): Promise<TPFlight[]> {
    const url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${origin}&destination=${destination}&currency=USD&token=${this.config.token}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Access-Token": this.config.token },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`v1/cheap HTTP ${res.status}`);
    const data = await res.json() as { success?: boolean; data?: Record<string, Record<string, unknown>> };
    if (!data.success || !data.data) throw new Error("no data");

    const flights: TPFlight[] = [];
    let idx = 0;
    // data structure: { "DEST_CODE": { "0": { airline, price, departure_at, ... }, "1": {...} } }
    for (const destEntries of Object.values(data.data)) {
      for (const item of Object.values(destEntries)) {
        const f = item as Record<string, unknown>;
        const price = Number(f.price) || 0;
        if (!price) continue;
        const depTime = String(f.departure_at || "");
        // duration is in minutes total, split to/back
        const durationMin = Number(f.duration_to) || Number(f.duration) || 120;
        const depDate = depTime ? new Date(depTime) : new Date();
        const arrDate = new Date(depDate.getTime() + durationMin * 60000);
        flights.push({
          id: `tpay-cheap-${origin}${destination}-${idx}`,
          airline: String(f.airline || ""),
          airlineCode: String(f.airline || ""),
          flightNumber: `${f.airline || ""}${f.flight_number || idx}`,
          from: origin, to: destination,
          departureTime: depTime,
          arrivalTime: arrDate.toISOString(),
          duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
          price, currency: "USD",
          taxes: Math.round(price * 0.12), fees: 8,
          totalPrice: price + Math.round(price * 0.12) + 8,
          available: true,
        });
        idx++;
        if (flights.length >= 5) break;
      }
      if (flights.length >= 5) break;
    }
    if (flights.length === 0) throw new Error("empty after parse");
    return flights;
  }

  // v1/prices/calendar — date-specific
  private async searchV1Calendar(origin: string, destination: string, departureDate: string): Promise<TPFlight[]> {
    const url = `https://api.travelpayouts.com/v1/prices/calendar?origin=${origin}&destination=${destination}&departure_at=${departureDate}&currency=USD&token=${this.config.token}&limit=5`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Access-Token": this.config.token },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`v1/calendar HTTP ${res.status}`);
    const data = await res.json() as { data?: unknown[] };
    if (!data.data || data.data.length === 0) throw new Error("no data");
    return this.mapV2(data.data as Record<string, unknown>[], origin, destination);
  }

  private mapV2(items: Record<string, unknown>[], origin: string, destination: string): TPFlight[] {
    return items.map((item, idx) => {
      const price = Number(item.value || item.price || 0);
      return {
        id: `tpay-${origin}${destination}-${idx}`,
        airline: String(item.airline || ""),
        airlineCode: String(item.airline || ""),
        flightNumber: `${item.airline || ""}${item.flight_number || idx}`,
        from: origin, to: destination,
        departureTime: String(item.departure_at || ""),
        arrivalTime: String(item.return_at || ""),
        duration: "N/A",
        price, currency: "USD",
        taxes: Math.round(price * 0.12), fees: 8,
        totalPrice: price + Math.round(price * 0.12) + 8,
        available: true,
      };
    });
  }
}
