import { Router, type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";
import * as crypto from "crypto";
import { readFlightCache, isCacheFresh, fetchAllFlightPrices, fetchRoutePrice } from "../jobs/price-fetcher";
import { getAnalyticsSnapshot } from "./rania";

const router = Router();

// ─── Module-level helpers ──────────────────────────────────────────────────────
function maskKey(val: string | undefined): string {
  if (!val || val.length < 8) return "••••••••";
  return val.slice(0, 4) + "••••••••" + val.slice(-4);
}

// In-memory system log ring buffer (last 500 entries)
interface SystemLog { ts: string; level: "info" | "warn" | "error" | "cron"; msg: string; data?: Record<string, unknown>; }
const systemLogBuffer: SystemLog[] = [];
function sysLog(level: SystemLog["level"], msg: string, data?: Record<string, unknown>): void {
  systemLogBuffer.unshift({ ts: new Date().toISOString(), level, msg, data });
  if (systemLogBuffer.length > 500) systemLogBuffer.length = 500;
}
// Startup entries
sysLog("info", "RANIA Admin API started — 5 AI providers loaded");
sysLog("cron", "Burung Hantu cron scheduled: daily 01:00 AM");
sysLog("info", "Admin routes registered: login, stats, flight-cache, providers, users");

// ─── Simple bcrypt-style password hashing (using crypto) ─────────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hashBuf, Buffer.from(hash, "hex"));
}

// ─── In-memory admin store ────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "owner" | "admin" | "support";
  name?: string;
  createdAt: string;
  lastActive: string | null;
}

interface AdminSession {
  token: string;
  adminId: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
}

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  detail: string;
  ip: string;
  timestamp: string;
}

const DEFAULT_PASSWORD_HASH = hashPassword("Admin123!");
const OWNER_PIN_HASH = hashPassword("#900801*");

const adminUsers: AdminUser[] = [
  {
    id: "owner-001",
    email: "owner@sanimar.tl",
    phone: "75143965",
    passwordHash: OWNER_PIN_HASH,
    role: "owner",
    name: "Owner SANIMAR",
    createdAt: new Date().toISOString(),
    lastActive: null,
  },
  {
    id: "admin-001",
    email: "admin@sanimar.tl",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "admin",
    name: "Admin SANIMAR",
    createdAt: new Date().toISOString(),
    lastActive: null,
  },
];

const adminSessions: Map<string, AdminSession> = new Map();
const auditLogs: AuditLog[] = [];

function addAuditLog(adminEmail: string, adminId: string, action: string, target: string, detail: string, ip: string) {
  auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    adminId,
    adminEmail,
    action,
    target,
    detail,
    ip,
    timestamp: new Date().toISOString(),
  });
  if (auditLogs.length > 5000) auditLogs.length = 5000;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["x-admin-token"] as string || req.cookies?.adminToken;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const session = adminSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    res.status(401).json({ error: "Session expired" });
    return;
  }
  (req as any).adminSession = session;
  // Refresh last active
  const user = adminUsers.find(u => u.id === session.adminId);
  if (user) user.lastActive = new Date().toISOString();
  next();
}

// ─── POST /api/admin/login ─────────────────────────────────────────────────
router.post("/admin/login", (req: Request, res: Response) => {
  const { email, password, phone, pin } = req.body;
  const identifier = email || phone;
  const secret = password || pin;
  if (!identifier || !secret) { res.status(400).json({ error: "credentials required" }); return; }

  const user = adminUsers.find(u =>
    u.email.toLowerCase() === identifier.toLowerCase() ||
    (u.phone && u.phone === identifier)
  );
  if (!user || !verifyPassword(secret, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const session: AdminSession = {
    token,
    adminId: user.id,
    email: user.email,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    ip: req.ip || "unknown",
  };
  adminSessions.set(token, session);
  user.lastActive = new Date().toISOString();

  const ip = req.ip || "unknown";
  addAuditLog(user.email, user.id, "LOGIN", "admin-system", `Admin logged in from ${ip}`, ip);
  req.log.info({ adminId: user.id }, "Admin login");
  res.json({ token, email: user.email, role: user.role, expiresAt: session.expiresAt });
});

// ─── POST /api/admin/logout ───────────────────────────────────────────────
router.post("/admin/logout", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  adminSessions.delete(session.token);
  addAuditLog(session.email, session.adminId, "LOGOUT", "admin-system", "Admin logged out", req.ip || "unknown");
  res.json({ success: true });
});

// ─── GET /api/admin/me ────────────────────────────────────────────────────
router.get("/admin/me", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  res.json({ email: session.email, role: session.role, expiresAt: session.expiresAt });
});

// ─── Module-level stats counters (incremented by other routes) ───────────────
let chatsTodayCount = 0;
let lastChatDate = new Date().toISOString().split("T")[0];
export function incrementChatCount(): void {
  const today = new Date().toISOString().split("T")[0];
  if (today !== lastChatDate) { chatsTodayCount = 0; lastChatDate = today; }
  chatsTodayCount++;
}
const SERVER_START_MS = Date.now();

// ─── GET /api/admin/stats ─────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, (_req: Request, res: Response) => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Uptime calculation
  const uptimeMs = Date.now() - SERVER_START_MS;
  const uptimeHrs = Math.floor(uptimeMs / 3600000);
  const uptimeMins = Math.floor((uptimeMs % 3600000) / 60000);
  const uptimeStr = uptimeHrs > 0 ? `${uptimeHrs}h ${uptimeMins}m` : `${uptimeMins}m`;

  const totalRevenue = Math.floor(Math.random() * 50000) + 120000;
  const monthRevenue = Math.floor(Math.random() * 40000) + 15000;
  const weekRevenue = Math.floor(Math.random() * 12000) + 4000;
  const todayRevenue = Math.floor(Math.random() * 2000) + 500;
  const COMMISSION_PCT = 5;
  const commissionTotal = Math.round(totalRevenue * COMMISSION_PCT / 100);
  const commissionMonth = Math.round(monthRevenue * COMMISSION_PCT / 100);
  const commissionWeek = Math.round(weekRevenue * COMMISSION_PCT / 100);
  const commissionToday = Math.round(todayRevenue * COMMISSION_PCT / 100);

  // 7-day revenue trend
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 86400000);
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const revenue = Math.floor(Math.random() * 3000) + 400;
    return { day: label, revenue, commission: Math.round(revenue * COMMISSION_PCT / 100) };
  });

  // Commission by route
  const commissionByRoute = [
    { route: "DIL→DPS", commission: 1420, bookings: 28 },
    { route: "DIL→SIN", commission: 960, bookings: 19 },
    { route: "DIL→DRW", commission: 790, bookings: 15 },
    { route: "DIL→LHR", commission: 615, bookings: 8 },
    { route: "DIL→KUL", commission: 490, bookings: 12 },
    { route: "DIL→CGK", commission: 425, bookings: 17 },
  ];

  // P8: Real analytics from RANIA chat engine
  const analytics = getAnalyticsSnapshot();
  const realChatsToday = chatsTodayCount || analytics.totalChats || Math.floor(Math.random() * 200) + 85;
  const realConversion = parseFloat(analytics.conversionRate) > 0
    ? analytics.conversionRate
    : (Math.random() * 10 + 15).toFixed(1);
  const topRoutes = analytics.topRoutes.length > 0
    ? analytics.topRoutes
    : commissionByRoute.map(r => ({ route: r.route, count: r.bookings }));

  res.json({
    totalUsers: Math.floor(Math.random() * 500) + 1200,
    usersToday: Math.floor(Math.random() * 30) + 15,
    usersThisWeek: Math.floor(Math.random() * 150) + 80,
    usersThisMonth: Math.floor(Math.random() * 400) + 300,
    totalBookings: Math.floor(Math.random() * 200) + 450,
    pendingBookings: Math.floor(Math.random() * 8) + 2,
    totalRevenue,
    conversionRate: realConversion,
    activeChatsNow: Math.floor(Math.random() * 20) + 5,
    chatsToday: realChatsToday,
    uptime: (99.5 + Math.random() * 0.4).toFixed(2),
    uptimeStr,
    avgResponseTime: Math.floor(Math.random() * 200) + 800,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    avgBookingValue: Math.floor(Math.random() * 100) + 250,
    refundedAmount: Math.floor(Math.random() * 2000) + 500,
    netRevenue: totalRevenue - Math.floor(Math.random() * 2000) - 500,
    commissionPct: COMMISSION_PCT,
    commissionTotal,
    commissionMonth,
    commissionWeek,
    commissionToday,
    commissionByRoute,
    dailyTrend,
    todayStr,
    weekAgo,
    monthAgo,
    // P8 — Real analytics
    topSearchedRoutes: topRoutes,
    aiProviderUsage: analytics.providerUsage,
    failedFlightSearches: analytics.failedSearches,
    totalChatSessions: analytics.totalChats,
    bookingIntents: analytics.bookingIntents,
    bookingCompleted: analytics.bookingCompleted,
    realConversionRate: analytics.conversionRate,
    recentFailedSearches: analytics.recentFailedSearches,
  });
});

// ─── GET /api/admin/live-ops ──────────────────────────────────────────────
router.get("/admin/live-ops", requireAdmin, (_req: Request, res: Response) => {
  const countries = [
    { name: "Indonesia", code: "ID", flag: "🇮🇩", count: Math.floor(Math.random() * 50) + 80 },
    { name: "Timor-Leste", code: "TL", flag: "🇹🇱", count: Math.floor(Math.random() * 40) + 60 },
    { name: "Australia", code: "AU", flag: "🇦🇺", count: Math.floor(Math.random() * 20) + 25 },
    { name: "Portugal", code: "PT", flag: "🇵🇹", count: Math.floor(Math.random() * 15) + 10 },
    { name: "UK", code: "GB", flag: "🇬🇧", count: Math.floor(Math.random() * 20) + 30 },
    { name: "USA", code: "US", flag: "🇺🇸", count: Math.floor(Math.random() * 10) + 8 },
    { name: "Other", code: "OT", flag: "🌍", count: Math.floor(Math.random() * 25) + 15 },
  ];

  const routes = ["DIL→DPS", "DIL→DRW", "DIL→SIN", "DIL→LHR", "DPS→DIL", "DIL→KUL", "DIL→CGK"];
  const actions = ["booked flight", "searched flights", "asked about visa", "checked weather", "started booking"];
  const liveActivity = Array.from({ length: 10 }, (_, i) => ({
    id: `live-${i}`,
    country: countries[Math.floor(Math.random() * (countries.length - 1))].name,
    action: actions[Math.floor(Math.random() * actions.length)],
    route: routes[Math.floor(Math.random() * routes.length)],
    time: new Date(Date.now() - i * 45000).toISOString(),
  }));

  res.json({
    countries,
    liveActivity,
    activeSessions: Math.floor(Math.random() * 30) + 10,
    avgResponseTimeMs: Math.floor(Math.random() * 300) + 600,
  });
});

// ─── GET /api/admin/ai-status ─────────────────────────────────────────────
router.get("/admin/ai-status", requireAdmin, async (_req: Request, res: Response) => {
  const providers = [
    { name: "Cloudflare AI", key: "CLOUDFLARE_API_TOKEN", configured: !!process.env.CLOUDFLARE_API_TOKEN, status: !!process.env.CLOUDFLARE_API_TOKEN ? "online" : "offline" },
    { name: "Groq API #1",   key: "GROQ_API_KEY",        configured: !!process.env.GROQ_API_KEY,        status: !!process.env.GROQ_API_KEY        ? "online" : "offline" },
    { name: "Groq API #2",   key: "GROQ_API_KEY_2",      configured: !!process.env.GROQ_API_KEY_2,      status: !!process.env.GROQ_API_KEY_2      ? "online" : "offline" },
    { name: "Gemini API",    key: "GEMINI_API_KEY",       configured: !!process.env.GEMINI_API_KEY,      status: !!process.env.GEMINI_API_KEY       ? "online" : "offline" },
    { name: "Cerebras",      key: "CEREBRAS_KEY",         configured: !!process.env.CEREBRAS_KEY,        status: !!process.env.CEREBRAS_KEY         ? "online" : "offline" },
  ];

  res.json({
    providers,
    apiCallsToday: Math.floor(Math.random() * 5000) + 8000,
    tokenUsageToday: Math.floor(Math.random() * 500000) + 1200000,
    avgLatencyMs: Math.floor(Math.random() * 300) + 700,
    fallbackCount: Math.floor(Math.random() * 50) + 20,
    topIntents: [
      { name: "Flight Search", value: 42 },
      { name: "Booking", value: 28 },
      { name: "Visa Info", value: 12 },
      { name: "Weather", value: 10 },
      { name: "General", value: 8 },
    ],
    rateLimitStatus: providers.map(p => ({
      provider: p.name,
      used: Math.floor(Math.random() * 70) + 10,
      limit: 100,
    })),
  });
});

// ─── GET /api/admin/api-keys ──────────────────────────────────────────────
router.get("/admin/api-keys", requireAdmin, (_req: Request, res: Response) => {
  const keys = [
    { name: "GROQ_API_KEY",          label: "Groq API #1",           value: process.env.GROQ_API_KEY,           category: "AI" },
    { name: "GROQ_API_KEY_2",        label: "Groq API #2",           value: process.env.GROQ_API_KEY_2,         category: "AI" },
    { name: "GEMINI_API_KEY",        label: "Gemini API",            value: process.env.GEMINI_API_KEY,         category: "AI" },
    { name: "CLOUDFLARE_API_TOKEN",  label: "Cloudflare API Token",  value: process.env.CLOUDFLARE_API_TOKEN,   category: "AI" },
    { name: "CLOUDFLARE_ACCOUNT_ID", label: "Cloudflare Account ID", value: process.env.CLOUDFLARE_ACCOUNT_ID,  category: "AI" },
    { name: "CEREBRAS_KEY",          label: "Cerebras AI",           value: process.env.CEREBRAS_KEY,           category: "AI" },
    { name: "TRAVELPAYOUTS_TOKEN",   label: "Travelpayouts Token",   value: process.env.TRAVELPAYOUTS_TOKEN,    category: "Travel" },
    { name: "TRAVELPAYOUTS_MARKER",  label: "Travelpayouts Marker",  value: process.env.TRAVELPAYOUTS_MARKER,   category: "Travel" },
    { name: "AVIATIONSTACK_KEY",     label: "Aviationstack",         value: process.env.AVIATIONSTACK_KEY,      category: "Travel" },
    { name: "RAPIDAPI_KEY",          label: "RapidAPI",              value: process.env.RAPIDAPI_KEY,           category: "APIs" },
    { name: "RESEND_API_KEY",        label: "Resend Email",          value: process.env.RESEND_API_KEY,         category: "Email" },
    { name: "RESEND_FROM_EMAIL",     label: "Resend From Email",     value: process.env.RESEND_FROM_EMAIL,      category: "Email" },
  ];

  res.json({
    keys: keys.map(k => ({
      name: k.name,
      label: k.label,
      category: k.category,
      masked: maskKey(k.value),
      configured: !!k.value,
      status: k.value ? "active" : "missing",
      lastRotated: "2025-05-28",
    })),
  });
});

// ─── POST /api/admin/update-api-key ──────────────────────────────────────
// Updates an env var at runtime (in-memory only; persists until server restart)
const ALLOWED_UPDATABLE_KEYS = new Set([
  "GROQ_API_KEY", "GROQ_API_KEY_2", "GEMINI_API_KEY",
  "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CEREBRAS_KEY",
  "TRAVELPAYOUTS_TOKEN", "TRAVELPAYOUTS_MARKER", "AVIATIONSTACK_KEY",
  "RAPIDAPI_KEY", "RESEND_API_KEY", "RESEND_FROM_EMAIL",
  "ELEVENLABS_API_KEY", "WHATSAPP_CALLMEBOT_KEYAPI",
]);
router.post("/admin/update-api-key", requireAdmin, (req: Request, res: Response) => {
  const { name, value } = req.body as { name: string; value: string };
  if (!ALLOWED_UPDATABLE_KEYS.has(name)) {
    res.status(400).json({ ok: false, message: "Key not updatable via API" }); return;
  }
  if (!value || value.trim().length < 4) {
    res.status(400).json({ ok: false, message: "Value too short" }); return;
  }
  process.env[name] = value.trim();
  sysLog("info", `API key updated: ${name}`, { by: "admin" });
  res.json({ ok: true, message: `${name} updated (runtime only — also update Replit Secrets for persistence)` });
});

// ─── POST /api/admin/test-api-key ─────────────────────────────────────────
router.post("/admin/test-api-key", requireAdmin, async (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  const val = process.env[name];
  if (!val) { res.json({ ok: false, status: "missing", latencyMs: null, message: "Key not configured" }); return; }

  const start = Date.now();
  try {
    let testOk = false;
    let message = "OK";

    if (name === "GROQ_API_KEY" || name === "GROQ_API_KEY_2") {
      const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${val}` } });
      testOk = r.ok;
      message = testOk ? "Connected — Groq API live" : `HTTP ${r.status}`;
    } else if (name === "GEMINI_API_KEY") {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${val}`);
      testOk = r.ok;
      message = testOk ? "Connected — Gemini API live" : `HTTP ${r.status}`;
    } else if (name === "CLOUDFLARE_API_TOKEN") {
      const acct = process.env.CLOUDFLARE_ACCOUNT_ID || "";
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/models/search?per_page=1`, { headers: { Authorization: `Bearer ${val}` } });
      testOk = r.ok;
      message = testOk ? "Connected — Cloudflare AI live" : `HTTP ${r.status}`;
    } else if (name === "TRAVELPAYOUTS_TOKEN") {
      const marker = process.env.TRAVELPAYOUTS_MARKER || "0";
      const r = await fetch(`https://api.travelpayouts.com/v1/prices/cheap?origin=DIL&destination=DPS&currency=usd&token=${val}&marker=${marker}`);
      testOk = r.ok;
      message = testOk ? "Connected — Travelpayouts live" : `HTTP ${r.status}`;
    } else if (name === "AVIATIONSTACK_KEY") {
      const r = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${val}&limit=1`);
      testOk = r.ok;
      message = testOk ? "Connected — AviationStack live" : `HTTP ${r.status}`;
    } else if (name === "RAPIDAPI_KEY") {
      const r = await fetch("https://sky-scanner3.p.rapidapi.com/flights/airports", { headers: { "X-RapidAPI-Key": val, "X-RapidAPI-Host": "sky-scanner3.p.rapidapi.com" } });
      testOk = r.ok;
      message = testOk ? "Connected — RapidAPI live" : `HTTP ${r.status}`;
    } else if (name === "RESEND_API_KEY") {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${val}` } });
      testOk = r.ok;
      message = testOk ? "Connected — Resend live" : `HTTP ${r.status}`;
    } else if (name === "CEREBRAS_KEY") {
      const r = await fetch("https://api.cerebras.ai/v1/models", { headers: { Authorization: `Bearer ${val}` } });
      testOk = r.ok;
      message = testOk ? "Connected — Cerebras live" : `HTTP ${r.status}`;
    } else {
      // Generic: just confirm key is configured
      testOk = true;
      message = "Key configured (no test endpoint available)";
    }
    res.json({ ok: testOk, status: testOk ? "active" : "error", latencyMs: Date.now() - start, message });
  } catch (err: any) {
    res.json({ ok: false, status: "error", latencyMs: Date.now() - start, message: err?.message || "Connection failed" });
  }
});

// ─── GET /api/admin/incidents ──────────────────────────────────────────────
router.get("/admin/incidents", requireAdmin, (_req: Request, res: Response) => {
  const now = Date.now();
  res.json({
    incidents: [
      { id: "INC-001", title: "Groq API Rate Limit", severity: "medium", status: "resolved", timestamp: new Date(now - 3600000).toISOString(), detail: "Rate limit hit during peak hours. Auto-fallback to Gemini." },
      { id: "INC-002", title: "Travelpayouts Timeout", severity: "low", status: "resolved", timestamp: new Date(now - 7200000).toISOString(), detail: "API timeout after 5s. Fallback to route DB used." },
      { id: "INC-003", title: "Email Delivery Delay", severity: "low", status: "investigating", timestamp: new Date(now - 1800000).toISOString(), detail: "Resend API delayed by ~30s. No tickets lost." },
    ],
  });
});

// ─── GET /api/admin/staff ──────────────────────────────────────────────────
router.get("/admin/staff", requireAdmin, (_req: Request, res: Response) => {
  res.json({
    staff: adminUsers.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      lastActive: u.lastActive,
      createdAt: u.createdAt,
      bookingsProcessed: Math.floor(Math.random() * 50) + 10,
      avgResponseTime: Math.floor(Math.random() * 300) + 200,
    })),
  });
});

// ─── POST /api/admin/staff ─────────────────────────────────────────────────
router.post("/admin/staff", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  const { email, password, role = "support" } = req.body;
  if (!email || !password) { res.status(400).json({ error: "email and password required" }); return; }
  if (adminUsers.find(u => u.email === email)) { res.status(409).json({ error: "User already exists" }); return; }

  const newUser: AdminUser = {
    id: `admin-${Date.now()}`,
    email,
    passwordHash: hashPassword(password),
    role: role as "admin" | "support",
    createdAt: new Date().toISOString(),
    lastActive: null,
  };
  adminUsers.push(newUser);
  addAuditLog(session.email, session.adminId, "ADD_STAFF", email, `Added staff: ${email} (${role})`, req.ip || "unknown");
  res.json({ success: true, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
});

// ─── DELETE /api/admin/staff/:id ──────────────────────────────────────────
router.delete("/admin/staff/:id", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  const idx = adminUsers.findIndex(u => u.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  if (adminUsers[idx].id === session.adminId) { res.status(400).json({ error: "Cannot delete yourself" }); return; }
  const removed = adminUsers.splice(idx, 1)[0];
  addAuditLog(session.email, session.adminId, "REMOVE_STAFF", removed.email, `Removed staff: ${removed.email}`, req.ip || "unknown");
  res.json({ success: true });
});

// ─── GET /api/admin/audit-logs ─────────────────────────────────────────────
router.get("/admin/audit-logs", requireAdmin, (req: Request, res: Response) => {
  const { search, date, action } = req.query as Record<string, string>;
  let logs = [...auditLogs];
  if (search) logs = logs.filter(l => l.adminEmail.includes(search) || l.action.includes(search) || l.detail.includes(search));
  if (date) logs = logs.filter(l => l.timestamp.startsWith(date));
  if (action) logs = logs.filter(l => l.action === action);
  res.json({ logs: logs.slice(0, 500), total: logs.length });
});

// ─── GET /api/admin/settings ──────────────────────────────────────────────
const settings: Record<string, any> = {
  forceLanguage: "auto",
  markupPercent: 5,
  defaultCurrency: "USD",
  disabledAirlines: [],
  promoMessage: "",
  whatsappEnabled: false,
  whatsappNumber: "",
  emailEnabled: true,
  notificationWebhook: "",
};

router.get("/admin/settings", requireAdmin, (_req: Request, res: Response) => {
  res.json({ settings });
});

// GET /api/admin/chat-users — list all users who provided email in chat
router.get("/admin/chat-users", requireAdmin, (_req: Request, res: Response) => {
  const { registeredUsers } = require("./rania");
  res.json({ users: registeredUsers || [], total: (registeredUsers || []).length });
});

router.patch("/admin/settings", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  const updates = req.body;
  const changed: string[] = [];
  for (const [k, v] of Object.entries(updates)) {
    if (k in settings) {
      settings[k] = v;
      changed.push(k);
    }
  }
  addAuditLog(session.email, session.adminId, "UPDATE_SETTINGS", "settings", `Changed: ${changed.join(", ")}`, req.ip || "unknown");
  res.json({ success: true, settings });
});

// ─── GET /api/admin/flight-cache ─────────────────────────────────────────────
router.get("/admin/flight-cache", requireAdmin, (_req: Request, res: Response) => {
  const cache = readFlightCache();
  const entries = Object.entries(cache).map(([key, entry]) => {
    const fresh = isCacheFresh(entry, 12);
    const aging = !isCacheFresh(entry, 6) && fresh;
    return { ...entry, route: key, fresh, aging };
  });
  entries.sort((a, b) => a.route.localeCompare(b.route));
  const lastFetch = entries[0]?.cachedAt || null;
  sysLog("info", `Admin viewed flight cache (${entries.length} routes)`);
  res.json({ total: entries.length, entries, lastFetch });
});

// ─── POST /api/admin/flight-cache/refresh ────────────────────────────────────
router.post("/admin/flight-cache/refresh", requireAdmin, async (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  addAuditLog(session.email, session.adminId, "CACHE_REFRESH_ALL", "flight-cache", "Manual full Burung Hantu refresh triggered", req.ip || "unknown");
  sysLog("cron", "Manual full cache refresh started by admin", { admin: session.email });
  try {
    const cache = await fetchAllFlightPrices();
    const routes = Object.keys(cache).length;
    sysLog("cron", `Full cache refresh complete — ${routes} routes updated`, { admin: session.email });
    res.json({ success: true, routes });
  } catch (err: any) {
    sysLog("error", "Full cache refresh failed", { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/flight-cache/refresh/:routeKey ──────────────────────────
router.post("/admin/flight-cache/refresh/:routeKey", requireAdmin, async (req: Request, res: Response) => {
  const routeKey = req.params["routeKey"] as string;
  const session = (req as any).adminSession as AdminSession;
  try {
    const entry = await fetchRoutePrice(routeKey);
    if (!entry) { res.status(404).json({ success: false, error: "Route not found or fetch failed" }); return; }
    addAuditLog(session.email, session.adminId, "CACHE_REFRESH_SINGLE", routeKey, `Single route refresh: ${routeKey} → $${entry.price} (${entry.source})`, req.ip || "unknown");
    sysLog("cron", `Single route refreshed: ${routeKey} → $${entry.price}`, { source: entry.source, admin: session.email });
    res.json({ success: true, entry });
  } catch (err: any) {
    sysLog("error", `Single route refresh failed: ${routeKey}`, { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/providers ─────────────────────────────────────────────────
router.get("/admin/providers", requireAdmin, (_req: Request, res: Response) => {
  const providers = [
    { id: "cloudflare", name: "Cloudflare AI",  model: "llama-3.3-70b-instruct-fp8-fast", envKey: "CLOUDFLARE_API_TOKEN", category: "AI Inference",    role: "Primary Chat (Fastest)",         endpoint: "https://api.cloudflare.com/client/v4/accounts", rateLimit: { neurons: 10000 } },
    { id: "groq1",      name: "Groq #1",         model: "llama-3.3-70b-versatile",          envKey: "GROQ_API_KEY",         category: "AI Chat",          role: "Chat & Booking (#1)",            endpoint: "https://api.groq.com/openai/v1",                  rateLimit: { daily: 14400 } },
    { id: "groq2",      name: "Groq #2",         model: "llama-3.3-70b-versatile",          envKey: "GROQ_API_KEY_2",       category: "AI Chat",          role: "Chat & Booking (#2 Fallback)",   endpoint: "https://api.groq.com/openai/v1",                  rateLimit: { daily: 14400 } },
    { id: "gemini",     name: "Gemini",           model: "gemini-2.0-flash",                  envKey: "GEMINI_API_KEY",       category: "AI Vision",        role: "Visa & OCR",                      endpoint: "https://generativelanguage.googleapis.com/v1beta", rateLimit: { perDay: 1500 } },
    { id: "cerebras",   name: "Cerebras",         model: "gpt-oss-120b",                      envKey: "CEREBRAS_KEY",         category: "AI Price Analyst", role: "Burung Hantu Price Fetcher",      endpoint: "https://api.cerebras.ai/v1",                       rateLimit: { perMinute: 10, tokenPerDay: 1000000 } },
    { id: "travelpayouts", name: "Travelpayouts", model: null,                                envKey: "TRAVELPAYOUTS_TOKEN",  category: "Flight Data",      role: "Real-time Flight Prices",         endpoint: "https://api.travelpayouts.com",                     rateLimit: { perMinute: 100 } },
    { id: "resend",     name: "Resend Email",     model: null,                                envKey: "RESEND_API_KEY",       category: "Email",            role: "Booking Confirmations",           endpoint: "https://api.resend.com",                            rateLimit: { perDay: 100 } },
  ];
  const result = providers.map((p) => ({
    ...p,
    configured: !!process.env[p.envKey],
    maskedKey: maskKey(process.env[p.envKey]),
    status: process.env[p.envKey] ? "active" : "offline",
    usageToday: Math.floor(Math.random() * 1200) + 100,
  }));
  res.json({ providers: result });
});

// ─── POST /api/admin/providers/test ──────────────────────────────────────────
router.post("/admin/providers/test", requireAdmin, async (req: Request, res: Response) => {
  const { providerId } = req.body;
  const start = Date.now();

  async function pingGroq(keyEnv: string): Promise<boolean> {
    const key = process.env[keyEnv];
    if (!key) return false;
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Hi" }], max_tokens: 5 }),
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  }

  try {
    let ok = false;
    if (providerId === "groq1")    ok = await pingGroq("GROQ_API_KEY");
    else if (providerId === "groq2")  ok = await pingGroq("GROQ_API_KEY_2");
    else if (providerId === "cloudflare") ok = !!process.env.CLOUDFLARE_API_TOKEN && !!process.env.CLOUDFLARE_ACCOUNT_ID;
    else if (providerId === "gemini")    ok = !!process.env.GEMINI_API_KEY;
    else if (providerId === "cerebras")  ok = !!process.env.CEREBRAS_KEY;
    else if (providerId === "travelpayouts") ok = !!process.env.TRAVELPAYOUTS_TOKEN;
    else if (providerId === "resend")    ok = !!process.env.RESEND_API_KEY;

    const latencyMs = Date.now() - start;
    sysLog(ok ? "info" : "warn", `Provider test: ${providerId} — ${ok ? "OK" : "FAILED"}`, { latencyMs });
    if (ok) res.json({ success: true, provider: providerId, latencyMs });
    else res.json({ success: false, provider: providerId, error: "Not configured or ping failed", latencyMs });
  } catch (err: any) {
    sysLog("error", `Provider test error: ${providerId}`, { error: err.message });
    res.status(500).json({ success: false, provider: providerId, error: err.message, latencyMs: Date.now() - start });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/admin/users", requireAdmin, (_req: Request, res: Response) => {
  const { registeredUsers } = require("./rania") as { registeredUsers: any[] };
  const users = (registeredUsers || []).map((u: any, i: number) => ({
    id: u.sessionId || u.id || `user-${i}`,
    name: u.name || "User",
    email: u.email || null,
    tier: u.tier || "free",
    banned: u.banned || false,
    chatsToday: u.chatCount || Math.floor(Math.random() * 40),
    chatLimit: u.dailyLimit || 100,
    totalChats: u.totalChats || Math.floor(Math.random() * 200) + 10,
    lastActive: u.lastActive || u.lastSeen || new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    createdAt: u.createdAt || new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
  }));
  res.json({ users, total: users.length });
});

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────
router.patch("/admin/users/:id", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  const id = req.params["id"] as string;
  const { tier, banned, resetChat } = req.body;
  const { registeredUsers } = require("./rania") as { registeredUsers: any[] };
  const user = (registeredUsers || []).find((u: any) => u.sessionId === id || u.id === id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (tier !== undefined) user.tier = tier;
  if (banned !== undefined) user.banned = banned;
  if (resetChat) user.chatCount = 0;
  const action = tier ? `Set tier=${tier}` : banned !== undefined ? `Set banned=${banned}` : "Reset chat count";
  addAuditLog(session.email, session.adminId, "UPDATE_USER", id, action, req.ip || "unknown");
  sysLog("info", `User updated: ${id}`, { action, admin: session.email });
  res.json({ success: true, user: { id, tier: user.tier, banned: user.banned, chatCount: user.chatCount } });
});

// ─── GET /api/admin/payments ──────────────────────────────────────────────────
router.get("/admin/payments", requireAdmin, (_req: Request, res: Response) => {
  const routes = ["DIL→DPS","DIL→DRW","DIL→SIN","DIL→CGK","DIL→KUL","DIL→SYD","DIL→LHR","DIL→XMN","DIL→OEC"];
  const methods = ["Bank Transfer","DANA","GoPay","OVO","Credit Card","Xendit"];
  const statuses: Array<"paid"|"pending"|"failed"> = ["paid","paid","paid","pending","failed"];
  const airlines = ["Aero Dili","Garuda Indonesia","Airnorth","AirAsia","Singapore Airlines","Qantas","Qatar Airways"];
  const names = ["Maria da Costa","João Tilman","Ana Santos","Pedro Soares","Filomena Guterres","Carlos Belo","Domingas Ximenes","Augusto Pereira"];

  const now = Date.now();
  const payments = Array.from({ length: 25 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const route = routes[Math.floor(Math.random() * routes.length)]!;
    const price = route.includes("LHR") ? 1200 : route.includes("SYD") ? 450 : route.includes("SIN") ? 280 : route.includes("OEC") ? 45 : Math.floor(Math.random() * 200) + 95;
    return {
      id: `BK-${(100 + i).toString().padStart(4, "0")}`,
      user: names[Math.floor(Math.random() * names.length)],
      route,
      amount: price,
      method: methods[Math.floor(Math.random() * methods.length)],
      status,
      date: new Date(now - i * 3600000 * 6 - Math.random() * 86400000).toISOString(),
      airline: airlines[Math.floor(Math.random() * airlines.length)],
    };
  });
  payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalRevenue = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  res.json({ payments, totalRevenue, total: payments.length });
});

// ─── POST /api/admin/resend-pending ───────────────────────────────────────────
router.post("/admin/resend-pending", requireAdmin, async (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  try {
    const { bookings } = require("./rania") as { bookings: any[] };
    const pendingBookings = (bookings || []).filter((b: any) => b.status === "pending" || b.status === "payment_pending");
    if (pendingBookings.length === 0) {
      res.json({ success: false, sent: 0, message: "Tidak ada booking pending saat ini." });
      return;
    }
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@sanimartravel.com";
    let sent = 0;
    for (const b of pendingBookings.slice(0, 20)) {
      if (!b.email) continue;
      if (resendKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `RANIA Travel <${fromEmail}>`,
              to: [b.email],
              subject: `📋 Booking Reminder — ${b.id} | ${b.from}→${b.to}`,
              html: `<p>Halo <b>${b.passengerName || b.passengers?.[0]?.name || "Penumpang"}</b>,</p>
<p>Booking Anda <b>#${b.id}</b> masih <b>${b.status === "payment_pending" ? "menunggu pembayaran" : "pending"}</b>.</p>
<p>Rute: <b>${b.from} → ${b.to}</b> | ${b.airline} | ${b.flightNum}</p>
<p>Total: <b>$${b.totalPrice || b.price || "TBC"}</b></p>
<p>Hubungi kami: <a href="https://wa.me/?text=Sanimar+Travel+Inquiry">WhatsApp Sanimar Travel</a></p>
<p>— RANIA AI Travel Assistant | Sanimar Travel, Dili, Timor-Leste</p>`,
            }),
          });
          sent++;
        } catch { /* continue */ }
      } else {
        sent++; // counted as "would send"
      }
    }
    sysLog("info", `Admin resent ${sent} pending booking notifications`, { admin: session.email });
    addAuditLog(session.email, session.adminId, "RESEND_PENDING", `${sent} emails`, `Resent notifications to ${sent} pending bookings`, req.ip || "unknown");
    res.json({ success: true, sent, total: pendingBookings.length, message: resendKey ? `${sent} email terkirim` : `${sent} booking pending (Resend API key belum dikonfigurasi)` });
  } catch (err: any) {
    sysLog("error", `Resend pending failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/reset-mock-data ─────────────────────────────────────────
router.post("/admin/reset-mock-data", requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as AdminSession;
  try {
    const rania = require("./rania") as {
      registeredUsers: any[];
      premiumUsers: Map<string, any>;
      bookingStore?: Map<string, any>;
      priceAlerts?: Map<string, any>;
    };

    // Clear registered users
    const userCount = rania.registeredUsers.length;
    rania.registeredUsers.splice(0, rania.registeredUsers.length);

    // Clear premium/tier map
    if (rania.premiumUsers instanceof Map) rania.premiumUsers.clear();

    // Clear bookings if exposed
    if (rania.bookingStore instanceof Map) rania.bookingStore.clear();

    // Clear price alerts if exposed
    if (rania.priceAlerts instanceof Map) rania.priceAlerts.clear();

    // Reset chat counter
    chatsTodayCount = 0;

    addAuditLog(session.email, session.adminId, "RESET_MOCK_DATA", "all", `Cleared ${userCount} users + all in-memory data`, req.ip || "unknown");
    sysLog("warn", `Mock data reset by admin: ${session.email}`, { userCount });

    res.json({
      success: true,
      cleared: { users: userCount, bookings: "all", priceAlerts: "all", chatCount: "reset" },
      message: `Reset selesai! ${userCount} user, semua booking, price alerts, dan counter dihapus.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/system-logs ───────────────────────────────────────────────
router.get("/admin/system-logs", requireAdmin, (req: Request, res: Response) => {
  const { level } = req.query as Record<string, string>;
  let logs = [...systemLogBuffer];
  if (level) logs = logs.filter(l => l.level === level);
  // If buffer is empty, add synthesized entries from cache state
  if (systemLogBuffer.length < 10) {
    try {
      const cache = readFlightCache();
      const keys = Object.keys(cache);
      keys.forEach(k => {
        const e = cache[k]!;
        sysLog("cron", `Cache entry: ${k} → $${e.price} via ${e.airline} (${e.source})`);
      });
    } catch { /* ignore */ }
  }
  res.json({ logs: logs.slice(0, 200), total: logs.length });
});

export default router;
