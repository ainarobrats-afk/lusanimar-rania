export class AgentRouter {
  constructor() {
    this.agents = new Map();
    this.registerAgents();
  }

  registerAgents() {
    this.agents.set("market_agent", {
      name: "market_agent",
      description: "Search and recommend marketplace items",
      intents: ["search_product", "search_property", "search_vehicle", "search_job", "search_event"],
      handler: async (intent, entities, context) => {
        return {
          agent: "market_agent",
          intent,
          entities,
          message: `I'll search the marketplace for ${intent.replace("search_", "")}`,
          suggestedRoute: `/sanimar-market?category=${entities.category || "all"}`,
        };
      },
    });

    this.agents.set("travel_agent", {
      name: "travel_agent",
      description: "Handle travel searches",
      intents: ["search_flights", "search_hotels", "search_tours", "search_rental"],
      handler: async (intent, entities, context) => {
        const routeMap = {
          search_flights: "/travel/flights",
          search_hotels: "/travel/hotels",
          search_tours: "/travel/tours",
          search_rental: "/travel/rental",
        };
        return {
          agent: "travel_agent",
          intent,
          entities,
          message: `I'll find the best ${intent.replace("search_", "")} options`,
          suggestedRoute: routeMap[intent] || "/travel/flights",
        };
      },
    });

    this.agents.set("assistant_agent", {
      name: "assistant_agent",
      description: "General assistant",
      intents: ["greeting", "help", "unknown"],
      handler: async (intent, entities, context) => {
        return {
          agent: "assistant_agent",
          intent,
          entities,
          message: "Hello! I'm RANIA. I can help you find flights, hotels, tours, and marketplace items.",
          suggestedRoute: "/sanimar-market",
        };
      },
    });
  }

  async route(intent, entities = {}, context = {}) {
    for (const [name, agent] of this.agents.entries()) {
      if (agent.intents.includes(intent)) {
        return agent.handler(intent, entities, context);
      }
    }
    const fallback = this.agents.get("assistant_agent");
    return fallback.handler("unknown", entities, context);
  }
}

export default new AgentRouter();