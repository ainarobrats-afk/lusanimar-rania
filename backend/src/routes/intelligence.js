// Phase 5 — Intelligence Routes
// Exposes Intelligence Orchestrator via REST API

import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/rbac.js';
import intelligenceController from '../controllers/intelligenceController.js';

const router = Router();

// GET /intelligence/status — Orchestrator health
router.get('/status', authenticate, requirePermission('dashboard.view'), (req, res) => {
  return intelligenceController.getStatus(req, res);
});

// POST /intelligence/agent/intent-classifier/execute — Route intent to agent
router.post('/agent/intent-classifier/execute', authenticate, requirePermission('chat.view'), (req, res) => {
  return intelligenceController.executeAgent(req, res);
});

// Alias for AI chat used by main app
router.post('/chat', authenticate, requirePermission('chat.view'), async (req, res) => {
  try {
    const text = req.body?.text || req.body?.message || req.body?.pesan || "";
    const context = req.body?.context || { tipe_chat: req.body?.tipe_chat || 'general' };
    const sessionId = req.body?.session_id || req.headers['x-session-id'] || 'demo';
    const userId = req.user?.id || sessionId;
    const result = await orchestrator.processQuery(userId, text, context);
    res.json(result);
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /intelligence/tool/:toolId/execute — Execute a tool
router.post('/tool/:toolId/execute', authenticate, requirePermission('chat.view'), (req, res) => {
  return intelligenceController.executeTool(req, res);
});

// POST /intelligence/memory/:sessionId — Store context
router.post('/memory/:sessionId', authenticate, requirePermission('chat.view'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const data = req.body;
    const result = await orchestrator.executeAgent('context-manager', sessionId, data);
    res.json({ ok: true, sessionId, result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// GET /intelligence/memory/:sessionId — Retrieve context
router.get('/memory/:sessionId', authenticate, requirePermission('chat.view'), (req, res) => {
  const { sessionId } = req.params;
  const memory = orchestrator.getMemory(sessionId);
  if (!memory) return res.status(404).json({ ok: false, error: 'Session not found' });
  res.json({ ok: true, sessionId, memory });
});

// DELETE /intelligence/memory/:sessionId — Clear session
router.delete('/memory/:sessionId', authenticate, requirePermission('chat.view'), (req, res) => {
  const { sessionId } = req.params;
  orchestrator.clearMemory(sessionId);
  res.json({ ok: true, message: `Session ${sessionId} cleared` });
});

export default router;