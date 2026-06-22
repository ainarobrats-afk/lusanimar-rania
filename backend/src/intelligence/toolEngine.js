export class ToolEngine {
  constructor() {
    this.tools = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.tools.set("flight_search", {
      name: "flight_search",
      description: "Search flights between two airports",
      parameters: ["origin", "destination", "date", "passengers"],
      execute: async ({ origin, destination, date, passengers }) => {
        return {
          tool: "flight_search",
          status: "ok",
          result: {
            origin,
            destination,
            date,
            passengers,
            sampleResults: [
              { airline: "Citilink", price: 95, duration: "2h 30m", stops: "Direct" },
              { airline: "Lion Air", price: 120, duration: "3h 45m", stops: "Direct" },
            ],
          },
        };
      },
    });

    this.tools.set("hotel_search", {
      name: "hotel_search",
      description: "Search hotels by location",
      parameters: ["location", "checkIn", "checkOut", "guests"],
      execute: async (params) => {
        return {
          tool: "hotel_search",
          status: "ok",
          result: {
            ...params,
            sampleResults: [
              { name: "Hilton Bali Resort", price: 120, rating: 4.8 },
              { name: "Hotel Timor", price: 45, rating: 4.5 },
            ],
          },
        };
      },
    });

    this.tools.set("visa_checker", {
      name: "visa_checker",
      description: "Check visa requirements",
      parameters: ["country", "nationality"],
      execute: async ({ country, nationality }) => {
        return {
          tool: "visa_checker",
          status: "ok",
          result: {
            country,
            nationality,
            required: true,
            processingDays: 3,
            fee: 35,
          },
        };
      },
    });
  }

  async execute(toolName, params = {}) {
    const tool = this.tools.get(toolName);
    if (!tool) return { tool: toolName, status: "error", error: "tool_not_found" };
    return tool.execute(params);
  }
}

export default new ToolEngine();