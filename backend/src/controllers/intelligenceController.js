import orchestrator from "../intelligence/orchestrator.js";

export class IntelligenceController {
  async getStatus(req, res) {
    const status = orchestrator.getStatus();
    res.json({ ok: true, phase: "Phase 5 — Intelligence Layer", ...status });
  }

  async executeAgent(req, res) {
    try {
      const { agentId } = req.params;
      const input = req.body || {};
      const userId = req.user?.id || "demo-user";
      const result = await orchestrator.processQuery(userId, input.text || "", input.context || {});
      res.json(result);
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async executeTool(req, res) {
    try {
      const { toolId } = req.params;
      const params = req.body || {};
      const result = await orchestrator.executeTool(toolId, params);
      res.json({ ok: true, toolId, result });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async recordSearch(req, res) {
    try {
      const { sessionId } = req.params;
      const data = req.body || {};
      const session = await orchestrator.memory.recordSearch(sessionId, data.query || "", data.context || {});
      res.json({ ok: true, sessionId, session });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async getMemory(req, res) {
    const { sessionId } = req.params;
    const memory = orchestrator.getMemory(sessionId);
    if (!memory) return res.status(404).json({ ok: false, error: "Session not found" });
    res.json({ ok: true, sessionId, memory });
  }

  async clearMemory(req, res) {
    const { sessionId } = req.params;
    orchestrator.clearMemory(sessionId);
    res.json({ ok: true, message: `Session ${sessionId} cleared` });
  }
}

export default new IntelligenceController();