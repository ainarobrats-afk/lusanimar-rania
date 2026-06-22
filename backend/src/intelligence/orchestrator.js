import AgentRouter from "./agentRouter.js";
import ToolEngine from "./toolEngine.js";
import MemoryLayer from "./memoryLayer.js";

class Orchestrator {
  constructor() {
    this.router = AgentRouter;
    this.tools = ToolEngine;
    this.memory = MemoryLayer;
    this.status = { initialized: true, phase: "Phase 5" };
  }

  init() {
    this.status.initialized = true;
    return this.status;
  }

  getStatus() {
    return {
      ...this.status,
      components: ["AgentRouter", "ToolEngine", "MemoryLayer"],
      agents: Array.from(this.router.agents.keys()),
      tools: Array.from(this.tools.tools.keys()),
    };
  }

  async executeAgent(agentId, input) {
    const agent = this.router.agents.get(agentId);
    if (!agent) {
      return { ok: false, error: `Agent ${agentId} not found` };
    }
    return agent.handler(input.intent || "unknown", input.entities || {}, input.context || {});
  }

  async executeTool(toolId, params = {}) {
    return this.tools.execute(toolId, params);
  }

  async processQuery(userId, text, context = {}) {
    const session = await this.memory.getSession(userId);
    const intent = "search_product";
    const entities = { category: "all" };
    const routing = await this.router.route(intent, entities, context);
    const toolResult = await this.tools.execute("flight_search", { origin: "DIL", destination: "Bali", date: "2026-08-01", passengers: 1 });
    await this.memory.recordSearch(userId, text, { intent, entities });
    return {
      ok: true,
      result: {
        intent,
        entities,
        agent: routing.agent,
        message: routing.message,
        suggestedRoute: routing.suggestedRoute,
        toolResult,
      },
    };
  }

  getMemory(sessionId) {
    const entry = this.memory.store.get(sessionId);
    if (!entry) return null;
    return entry;
  }

  clearMemory(sessionId) {
    this.memory.store.delete(sessionId);
    return true;
  }
}

export default new Orchestrator();