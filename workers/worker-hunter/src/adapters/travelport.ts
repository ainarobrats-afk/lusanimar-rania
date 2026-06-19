// ============================================================================
// RANIA V2.1 — Travelport Adapter (MOCK MODE)
// Will be swapped with real Travelport uAPI in Week 2
//
// IRON RULE #4: This adapter MUST return real API prices.
// In mock mode, it returns clearly labeled mock data for development.
// In production, it MUST connect to real Travelport API.
// ============================================================================

export interface TravelportConfig {
  apiKey: string;
  secret: string;
}

export interface TravelportSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: string;
}

export interface TravelportFlight {
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
  cabinClass: string;
}

/**
 * Travelport Adapter — currently in MOCK mode.
 * The interface is designed to match real Travelport uAPI structure
 * so the swap in Week 2 is just replacing the implementation.
 */
export class TravelportAdapter {
  private config: TravelportConfig;
  private isMock: boolean;

  constructor(config: TravelportConfig) {
    this.config = config;
    // Mock mode when API key is empty or starts with "mock_"
    this.isMock = !config.apiKey || config.apiKey.startsWith("mock_");
  }

  async searchFlights(params: TravelportSearchParams): Promise<TravelportFlight[]> {
    if (this.isMock) {
      return this.mockSearch(params);
    }
    return this.realSearch(params);
  }

  /**
   * REAL Travelport uAPI search — placeholder for Week 2.
   * This will be implemented when Travelport API credentials are available.
   */
  private async realSearch(_params: TravelportSearchParams): Promise<TravelportFlight[]> {
    // TODO: Implement real Travelport uAPI call
    // 1. Authenticate with Travelport (OAuth2)
    // 2. Build AirSearchReq XML
    // 3. POST to Travelport uAPI endpoint
    // 4. Parse AirSearchRsp XML
    // 5. Map to TravelportFlight[]
    throw new Error("Travelport real API not yet implemented — waiting for API credentials from Maun Luis");
  }

  /**
   * MOCK search — returns simulated flight data for development.
   * Clearly labeled as mock data.
   *
   * NOTE: In production this method MUST NOT be called.
   * Real Travelport API MUST be used instead.
   */
  private async mockSearch(params: TravelportSearchParams): Promise<TravelportFlight[]> {
    const { origin, destination, departureDate, passengers } = params;

    // Generate mock flights based on route
    const now = new Date();
    const baseDate = new Date(departureDate + "T06:00:00Z");

    // Known routes from Dili (DIL)
    const routes: Record<string, Array<{ airline: string; code: string; duration: string; basePrice: number }>> = {
      "DIL-DPS": [
        { airline: "Citilink", code: "QG", duration: "2h 15m", basePrice: 185 },
        { airline: "Wings Air", code: "IW", duration: "2h 30m", basePrice: 165 },
        { airline: "Aero Dili", code: "8K", duration: "2h 20m", basePrice: 210 },
      ],
      "DIL-CGK": [
        { airline: "Citilink", code: "QG", duration: "4h 30m", basePrice: 320 },
        { airline: "Sriwijaya Air", code: "SJ", duration: "4h 45m", basePrice: 295 },
      ],
      "DIL-DAR": [
        { airline: "QantasLink", code: "QF", duration: "2h 00m", basePrice: 450 },
        { airline: "North Territory Air", code: "NT", duration: "2h 10m", basePrice: 380 },
      ],
      "DIL-SIN": [
        { airline: "Scoot", code: "TR", duration: "5h 00m", basePrice: 280 },
        { airline: "Singapore Airlines", code: "SQ", duration: "4h 50m", basePrice: 520 },
      ],
    };

    const routeKey = `${origin}-${destination}`;
    const routeFlights = routes[routeKey];

    if (!routeFlights) {
      // No mock data for this route — return empty (Iron Rule: no fake data)
      return [];
    }

    const flights: TravelportFlight[] = [];
    let flightIdx = 0;

    for (const route of routeFlights) {
      // Generate 2 departures per airline (morning + afternoon)
      for (const hourOffset of [0, 6]) {
        const depart = new Date(baseDate);
        depart.setUTCHours(depart.getUTCHours() + hourOffset);

        const durMinutes = parseInt(route.duration) * 60 + parseInt(route.duration.split("h ")[1] || "0");
        const arrive = new Date(depart.getTime() + durMinutes * 60 * 1000);

        const taxes = Math.round(route.basePrice * 0.15);
        const fees = 12;
        const totalPrice = (route.basePrice + taxes + fees) * passengers;

        flights.push({
          id: `tp-${origin}${destination}-${route.code}${flightIdx}-${departureDate}`,
          airline: route.airline,
          airlineCode: route.code,
          flightNumber: `${route.code}${100 + flightIdx}`,
          from: origin,
          to: destination,
          departureTime: depart.toISOString(),
          arrivalTime: arrive.toISOString(),
          duration: route.duration,
          price: route.basePrice,
          currency: "USD",
          taxes,
          fees,
          totalPrice,
          available: true,
          cabinClass: params.cabinClass || "economy",
        });

        flightIdx++;
      }
    }

    return flights;
  }
}
