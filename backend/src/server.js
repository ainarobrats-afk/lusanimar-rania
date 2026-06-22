import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import intelligenceRoutes from './routes/intelligence.js';
import marketRoutes from './routes/market.js';
import crossBorderRoutes from './routes/crossBorder.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(compression());

app.get('/', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'RANIA Marketplace API' }));

// Auth
app.use('/api/auth', authRoutes);

// ── P0 Admin API — serves AdminDashboard.tsx ──────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/rania', adminRoutes);  // /rania/bookings, /rania/revenue-by-currency, /rania/admin/app-users

// Phase 5 — Intelligence Layer
app.use('/api/intelligence', intelligenceRoutes);

// Direct /api/chat endpoint used by V5.x ChatMarket.tsx
app.post('/api/chat', async (req, res) => {
  try {
    const text = req.body?.text || req.body?.message || req.body?.pesan || "";
    const sessionId = req.body?.session_id || req.headers['x-session-id'] || 'demo';
    const context = { tipe_chat: req.body?.tipe_chat || 'general', ...(req.body?.context || {}) };

    // Try unified AI provider first
    try {
      const { chatCompletion } = await import('./services/aiProvider.js');
      const messages = [
        { role: 'system', content: 'You are RANIA, a helpful assistant for Rania Travel and Sanimar Market. Reply in the language of the user (Tetun, Indonesian, Portuguese, or English). Keep responses concise and actionable.' },
        ...(req.body?.history || []),
        { role: 'user', content: text },
      ];
      const aiResult = await chatCompletion(messages, { temperature: 0.7, max_tokens: 500 });
      res.json({
        ok: true,
        result: {
          intent: 'chat',
          message: aiResult.text,
          provider: aiResult.provider,
          suggestedRoute: context.tipe_chat === 'travel' ? '/travel' : '/home',
        },
      });
    } catch (aiErr) {
      console.warn('AI provider failed, falling back to orchestrator:', aiErr.message);
      const orch = (await import('./intelligence/orchestrator.js')).default;
      const result = await orch.processQuery(sessionId, text, context);
      res.json(result);
    }
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// SANIMAR Market 2.0 — Super Marketplace
app.use('/api/market', marketRoutes);

// Cross-Border Trade Engine
app.use('/api/cross-border', crossBorderRoutes);

app.use(errorHandler);

export default app;
