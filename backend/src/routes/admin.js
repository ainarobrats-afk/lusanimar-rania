// ============================================================================
// RANIA Admin API — Phase 4: Full RBAC Integration
// Serves AdminDashboard.tsx with JWT authentication + permission guards
// ============================================================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, generateToken, requirePermission, requireRole } from '../middleware/rbac.js';
import { ROLES, resolveRolePermissions, MODULE_PERMISSIONS, PERMISSIONS } from '../config/permissions.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// MOCK ADMIN STORE (replace with DB in production)
// ═══════════════════════════════════════════════════════════════════════════
const ADMIN_STORE = [
  { id: 1, email: 'super@rania.tl',     password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'super_admin',       name: 'Super Admin' },
  { id: 2, email: 'admin@rania.tl',     password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'admin',             name: 'Admin User' },
  { id: 3, email: 'ops@rania.tl',       password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'operations',        name: 'Operations Staff' },
  { id: 4, email: 'finance@rania.tl',   password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'finance',           name: 'Finance Team' },
  { id: 5, email: 'support@rania.tl',   password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'support',           name: 'Support Agent' },
  { id: 6, email: 'moderator@rania.tl', password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'content_moderator', name: 'Content Moderator' },
  { id: 7, email: 'auditor@rania.tl',   password: '$2b$10$FBfSrnwVDFyH4sSgJ.GnveBcYtF7C6K/6vu.iLCFVEHD1As/PYAke', role: 'read_only_auditor', name: 'Read-Only Auditor' },
];

// ═══════════════════════════════════════════════════════════════════════════
// AUTH: POST /login
// ═══════════════════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = ADMIN_STORE.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const permissions = resolveRolePermissions(user.role);
    const token = generateToken(
      { id: user.id, email: user.email, role: user.role, token_version: 1 },
      permissions
    );

    res.json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /logout — Invalidate token (client-side removal)
router.post('/logout', authenticate, (req, res) => {
  // In production: add token to blacklist or increment token_version
  res.json({ success: true, message: 'Logged out' });
});

// GET /me — Current user info
router.get('/me', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    permissions: req.user.permissions,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RBAC MANAGEMENT — Super Admin + Admin
// ═══════════════════════════════════════════════════════════════════════════

// GET /roles — List all roles with resolved permissions
router.get('/roles', authenticate, requireRole('super_admin'), (req, res) => {
  const rolesWithPerms = Object.entries(ROLES).map(([name, role]) => ({
    name,
    description: role.description,
    permissions: resolveRolePermissions(name),
  }));
  res.json({ roles: rolesWithPerms });
});

// GET /permissions — List all permission definitions
router.get('/permissions', authenticate, requireRole('super_admin'), (req, res) => {
  res.json({ permissions: PERMISSIONS });
});

// GET /admin-users — List all admin users with roles
router.get('/admin-users', authenticate, requireRole('super_admin', 'admin'), (req, res) => {
  const users = ADMIN_STORE.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  }));
  res.json({ users });
});

// POST /admin-users/role — Change user role (Super Admin only)
router.post('/admin-users/role', authenticate, requireRole('super_admin'), (req, res) => {
  const { userId, newRole } = req.body;
  if (!userId || !newRole) return res.status(400).json({ error: 'userId and newRole required' });
  if (!ROLES[newRole]) return res.status(400).json({ error: 'Invalid role' });

  const user = ADMIN_STORE.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldRole = user.role;
  user.role = newRole;
  const permissions = resolveRolePermissions(newRole);

  console.log(`[RBAC AUDIT] User ${user.email} role changed: ${oldRole} → ${newRole} by ${req.user.email}`);

  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, permissions });
});

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD MODULES — All protected with authenticate + requirePermission
// ═══════════════════════════════════════════════════════════════════════════

// GET /stats — Overview (requires dashboard.view)
router.get('/stats', authenticate, requirePermission('dashboard.view'), (req, res) => {
  const stats = {
    chatsToday: 1423, pendingBookings: 7, failedBookings: 3, activeChatsNow: 38,
    uptime: 99.97, uptimeStr: '99.97%', totalUsers: 4521, usersToday: 187,
    totalBookings: 892, bookingsToday: 12, confirmedBookings: 456, cancelledBookings: 89,
    totalRevenue: 84750, todayRevenue: 3850, weekRevenue: 22100, monthRevenue: 89200,
    commissionToday: 192, commissionWeek: 1105, commissionMonth: 4460, commissionTotal: 4237,
    netRevenue: 80513, refundedAmount: 1240, avgBookingValue: 95, conversionRate: 68,
    avgResponseTime: 847, onlineStaff: 4, aiRequestsToday: 2156,
    dailyTrend: [
      { day: 'Mon', revenue: 3200, commission: 160 },
      { day: 'Tue', revenue: 3850, commission: 192 },
      { day: 'Wed', revenue: 4100, commission: 205 },
      { day: 'Thu', revenue: 2950, commission: 147 },
      { day: 'Fri', revenue: 5200, commission: 260 },
      { day: 'Sat', revenue: 4800, commission: 240 },
      { day: 'Sun', revenue: 3500, commission: 175 },
    ],
    commissionByRoute: [
      { route: 'DIL→KUP', commission: 450, bookings: 38 },
      { route: 'KUP→DIL', commission: 420, bookings: 35 },
      { route: 'DIL→DRW', commission: 380, bookings: 22 },
      { route: 'DIL→CGK', commission: 320, bookings: 18 },
      { route: 'DIL→SOF', commission: 180, bookings: 8 },
    ],
  };
  res.json(stats);
});

// GET /bookings — Booking Control (requires bookings.view)
router.get('/bookings', authenticate, requirePermission('bookings.view'), (req, res) => {
  const { status, search } = req.query;
  const allBookings = [
    { id: 'BK-001', email: 'joao@example.com', passengerName: 'João Pereira', from: 'DIL', to: 'KUP', date: '2026-06-25', status: 'confirmed', totalPrice: 450000, currency: 'IDR', flightNum: 'JT-621', airline: 'Citilink', flightClass: 'Economy', adults: 1, children: 0, passengers: [{ name: 'João Pereira', passport: 'P123456', type: 'adult' }], phone: '+670 1234 5678', baseFare: 400000, taxes: 35000, baggageFee: 15000, createdAt: '2026-06-20T10:30:00Z', fraudScore: 12, fraudFlags: [], reviewFlag: false, notes: '', sentAt: '2026-06-20T10:35:00Z' },
    { id: 'BK-002', email: 'maria@example.com', passengerName: 'Maria dos Santos', from: 'KUP', to: 'DIL', date: '2026-06-26', status: 'pending', totalPrice: 520000, currency: 'IDR', flightNum: 'JT-622', airline: 'Citilink', flightClass: 'Economy', adults: 2, children: 1, passengers: [{ name: 'Maria dos Santos', passport: 'P789012', type: 'adult' }, { name: 'Carlos Santos', passport: 'P789013', type: 'adult' }, { name: 'Ana Santos', passport: 'P789014', type: 'child' }], phone: '+670 8765 4321', baseFare: 460000, taxes: 40000, baggageFee: 20000, createdAt: '2026-06-21T14:15:00Z' },
    { id: 'BK-003', email: 'budi@example.com', passengerName: 'Budi Santoso', from: 'DIL', to: 'DRW', date: '2026-06-28', status: 'processing', totalPrice: 1850000, currency: 'IDR', flightNum: 'VA-99', airline: 'Virgin Australia', flightClass: 'Business', adults: 1, children: 0, passengers: [{ name: 'Budi Santoso', passport: 'P345678', type: 'adult' }], phone: '+670 9988 7766', baseFare: 1600000, taxes: 150000, baggageFee: 100000, createdAt: '2026-06-22T09:00:00Z' },
    { id: 'BK-004', email: 'ana@example.com', passengerName: 'Ana Lopes', from: 'DIL', to: 'CGK', date: '2026-06-30', status: 'failed', totalPrice: 1200000, currency: 'IDR', flightNum: 'GA-881', airline: 'Garuda Indonesia', flightClass: 'Economy', adults: 1, children: 0, passengers: [{ name: 'Ana Lopes', passport: 'P901234', type: 'adult' }], phone: '+670 1122 3344', baseFare: 1050000, taxes: 100000, baggageFee: 50000, createdAt: '2026-06-23T16:45:00Z' },
    { id: 'BK-005', email: 'carlos@example.com', passengerName: 'Carlos Mendez', from: 'KUP', to: 'SOF', date: '2026-07-02', status: 'refunded', totalPrice: 750000, currency: 'IDR', flightNum: 'KO-301', airline: 'Kupang Airlines', flightClass: 'Economy', adults: 1, children: 0, passengers: [{ name: 'Carlos Mendez', passport: 'P567890', type: 'adult' }], phone: '+670 5566 7788', baseFare: 650000, taxes: 55000, baggageFee: 45000, createdAt: '2026-06-19T08:30:00Z' },
    { id: 'BK-006', email: 'siti@example.com', passengerName: 'Siti Rahma', from: 'DIL', to: 'KUP', date: '2026-07-05', status: 'cancelled', totalPrice: 480000, currency: 'IDR', flightNum: 'JT-623', airline: 'Citilink', flightClass: 'Economy', adults: 1, children: 0, passengers: [{ name: 'Siti Rahma', passport: 'P234567', type: 'adult' }], phone: '+670 2233 4455', baseFare: 420000, taxes: 35000, baggageFee: 25000, createdAt: '2026-06-18T11:00:00Z' },
    { id: 'BK-007', email: 'pedro@example.com', passengerName: 'Pedro Almeida', from: 'DRW', to: 'DIL', date: '2026-07-08', status: 'confirmed', totalPrice: 2200000, currency: 'IDR', flightNum: 'VA-100', airline: 'Virgin Australia', flightClass: 'Economy', adults: 2, children: 0, passengers: [{ name: 'Pedro Almeida', passport: 'P678901', type: 'adult' }, { name: 'Rita Almeida', passport: 'P678902', type: 'adult' }], phone: '+670 6677 8899', baseFare: 1900000, taxes: 180000, baggageFee: 120000, createdAt: '2026-06-24T13:20:00Z' },
  ];

  let filtered = [...allBookings];
  if (status && status !== 'all') filtered = filtered.filter(b => b.status.toLowerCase() === status.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b => (b.id && b.id.toLowerCase().includes(q)) || (b.email && b.email.toLowerCase().includes(q)) || (b.passengerName && b.passengerName.toLowerCase().includes(q)));
  }
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    bookings: filtered.map(b => ({ ...b, totalPrice: (b.totalPrice / 16000).toFixed(2), price: (b.totalPrice / 16000).toFixed(2), baseFare: (b.baseFare / 16000).toFixed(2), taxes: (b.taxes / 16000).toFixed(2), baggageFee: (b.baggageFee / 16000).toFixed(2) })),
    total: filtered.length,
  });
});

// PATCH /bookings/:id — Update booking status (requires bookings.edit)
router.patch('/bookings/:id', authenticate, requirePermission('bookings.edit'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'confirmed', 'failed', 'refunded', 'cancelled'];
  if (!status || !validStatuses.includes(status.toLowerCase())) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }
  res.json({ success: true, bookingId: id, status: status.toLowerCase(), updatedAt: new Date().toISOString(), message: `Booking ${id} status updated to ${status.toLowerCase()}` });
});

// POST /bookings/:id/resend — Resend e-ticket (requires bookings.edit)
router.post('/bookings/:id/resend', authenticate, requirePermission('bookings.edit'), (req, res) => {
  res.json({ success: true, bookingId: req.params.id, sentAt: new Date().toISOString(), channel: 'email', message: `E-ticket untuk booking ${req.params.id} telah dikirim ulang.` });
});

// GET /health — Health Monitor (requires dashboard.view)
router.get('/health', authenticate, requirePermission('dashboard.view'), (req, res) => {
  res.json({ api: 'online', db: 'online', ai: 'online', email: 'online', whatsapp: 'online',
    providers: { cloudflare: 'online', groq: 'offline', gemini: 'online', cerebras: 'online', travelport: 'online', pkfare: 'online' }
  });
});

// GET /live-ops — Live Operations (requires bookings.view)
router.get('/live-ops', authenticate, requirePermission('bookings.view'), (req, res) => {
  res.json({
    activeSessions: 38,
    countries: [
      { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', count: 45 },
      { code: 'ID', name: 'Indonesia', flag: '🇮🇩', count: 28 },
      { code: 'AU', name: 'Australia', flag: '🇦🇺', count: 12 },
      { code: 'PT', name: 'Portugal', flag: '🇵🇹', count: 8 },
      { code: 'SG', name: 'Singapore', flag: '🇸🇬', count: 5 },
      { code: 'OTHER', name: 'Other', flag: '🌍', count: 15 },
    ],
    liveActivity: [
      { country: 'Timor-Leste', action: 'Searched flights DIL → DPS', route: '/api/rania/search', time: new Date().toISOString() },
      { country: 'Indonesia', action: 'Completed booking BK-1024', route: '/api/rania/book', time: new Date(Date.now() - 30000).toISOString() },
      { country: 'Australia', action: 'Started chat with RANIA', route: '/api/chat', time: new Date(Date.now() - 60000).toISOString() },
      { country: 'Portugal', action: 'Viewed hotel partner list', route: '/api/hotels', time: new Date(Date.now() - 120000).toISOString() },
      { country: 'Timor-Leste', action: 'Uploaded product to Market', route: '/api/market/list', time: new Date(Date.now() - 180000).toISOString() },
    ]
  });
});

// GET /incidents — Incident/UGD (requires incidents.view)
router.get('/incidents', authenticate, requirePermission('incidents.view'), (req, res) => {
  res.json({
    incidents: [
      { id: 'INC-001', severity: 'medium', status: 'investigating', title: 'API latency spike on DIL-KUP route', detail: 'Response time exceeded 2s threshold for 15 minutes', timestamp: new Date().toISOString() },
      { id: 'INC-002', severity: 'low', status: 'resolved', title: 'Minor UI glitch in booking form', detail: 'Date picker not rendering correctly on mobile', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ]
  });
});

// GET /staff — Staff Performance (requires staff.view)
router.get('/staff', authenticate, requirePermission('staff.view'), (req, res) => {
  res.json({
    staff: [
      { id: 'STF-001', email: 'maria@sanimar.tl', role: 'admin', bookingsProcessed: 234, avgResponseTime: 450, lastActive: new Date().toISOString() },
      { id: 'STF-002', email: 'joao@sanimar.tl', role: 'support', bookingsProcessed: 189, avgResponseTime: 620, lastActive: new Date(Date.now() - 1800000).toISOString() },
      { id: 'STF-003', email: 'ana@sanimar.tl', role: 'support', bookingsProcessed: 156, avgResponseTime: 510, lastActive: new Date(Date.now() - 900000).toISOString() },
    ]
  });
});

// POST /staff — Add staff (requires staff.edit)
router.post('/staff', authenticate, requirePermission('staff.edit'), (req, res) => {
  res.json({ success: true, id: 'STF-' + Date.now(), message: 'Staff added' });
});

// DELETE /staff/:id — Remove staff (requires staff.edit)
router.delete('/staff/:id', authenticate, requirePermission('staff.edit'), (req, res) => {
  res.json({ success: true, message: 'Staff removed' });
});

// GET /audit-logs — Audit Logs (requires audit.view)
router.get('/audit-logs', authenticate, requirePermission('audit.view'), (req, res) => {
  res.json({
    total: 4,
    logs: [
      { id: 'LOG-001', adminEmail: 'super@rania.tl', action: 'LOGIN', target: 'System', detail: 'Admin login from 127.0.0.1', ip: '127.0.0.1', timestamp: new Date().toISOString() },
      { id: 'LOG-002', adminEmail: 'admin@rania.tl', action: 'UPDATE_BOOKING', target: 'BK-001', detail: 'Status changed to ISSUED', ip: '127.0.0.1', timestamp: new Date(Date.now() - 600000).toISOString() },
      { id: 'LOG-003', adminEmail: 'maria@sanimar.tl', action: 'SEND_NOTIFICATION', target: 'BK-003', detail: 'E-ticket resent via email', ip: '10.0.0.5', timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'LOG-004', adminEmail: 'admin@rania.tl', action: 'CONFIGURE_API_KEY', target: 'OpenRouter', detail: 'API key updated', ip: '127.0.0.1', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ]
  });
});

// GET /settings — Settings (requires settings.view)
router.get('/settings', authenticate, requirePermission('settings.view'), (req, res) => {
  res.json({
    settings: { forceLanguage: 'auto', defaultCurrency: 'USD', markupPercent: 5, promoMessage: 'Book early and save 10%!', whatsappEnabled: true, whatsappNumber: '+67012345678', notificationWebhook: 'https://hooks.slack.com/services/xxx' }
  });
});

// PATCH /settings — Update settings (requires settings.edit)
router.patch('/settings', authenticate, requirePermission('settings.edit'), (req, res) => {
  res.json({ success: true, settings: req.body, message: 'Settings updated' });
});

// GET /api-keys — API Key Management (requires api_keys.view)
router.get('/api-keys', authenticate, requirePermission('api_keys.view'), (req, res) => {
  const providers = [
    { name: 'Travelport', label: 'Travelport', category: 'Travel', configured: true, masked: 'trav***23', status: 'online', latency: 287, errors: 2, quotaUsage: 42 },
    { name: 'PKFARE', label: 'PKFARE', category: 'Travel', configured: true, masked: 'pkfa***89', status: 'online', latency: 412, errors: 0, quotaUsage: 28 },
    { name: 'OpenRouter', label: 'OpenRouter', category: 'AI', configured: true, masked: 'open***45', status: 'online', latency: 156, errors: 1, quotaUsage: 67 },
    { name: 'OpenAI', label: 'OpenAI', category: 'AI', configured: true, masked: 'sk-p***abc', status: 'online', latency: 234, errors: 0, quotaUsage: 55 },
    { name: 'Gemini', label: 'Gemini', category: 'AI', configured: true, masked: 'AIza***xyz', status: 'online', latency: 189, errors: 0, quotaUsage: 41 },
    { name: 'Groq', label: 'Groq', category: 'AI', configured: false, masked: 'gsk-***---', status: 'offline', latency: 0, errors: 0, quotaUsage: 0 },
    { name: 'Cloudflare AI', label: 'Cloudflare AI', category: 'AI', configured: true, masked: 'cf-***78', status: 'online', latency: 98, errors: 3, quotaUsage: 73 },
    { name: 'Supabase', label: 'Supabase', category: 'APIs', configured: true, masked: 'sup***56', status: 'online', latency: 45, errors: 0, quotaUsage: 34 },
  ];
  res.json({ keys: providers, totalConfigured: providers.filter(p => p.configured).length, totalKeys: providers.length });
});

// POST /update-api-key — Update API key (requires api_keys.edit)
router.post('/update-api-key', authenticate, requirePermission('api_keys.edit'), (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) return res.status(400).json({ error: 'name and value required' });
  res.json({ ok: true, name, message: `API key ${name} berhasil disimpan.` });
});

// POST /test-api-key — Test API key (requires api_keys.edit)
router.post('/test-api-key', authenticate, requirePermission('api_keys.edit'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const results = {
    Travelport: { ok: true, status: 'connected', latencyMs: 287, message: 'Travelport uAPI connected successfully' },
    PKFARE: { ok: true, status: 'connected', latencyMs: 412, message: 'PKFARE API connected' },
    OpenRouter: { ok: true, status: 'connected', latencyMs: 156, message: 'OpenRouter API responding' },
    OpenAI: { ok: true, status: 'connected', latencyMs: 234, message: 'OpenAI API responding' },
    Gemini: { ok: true, status: 'connected', latencyMs: 189, message: 'Gemini API responding' },
    Groq: { ok: false, status: 'error', latencyMs: null, message: 'API key not configured. Update key first.' },
    'Cloudflare AI': { ok: true, status: 'connected', latencyMs: 98, message: 'Cloudflare Workers AI API connected' },
    Supabase: { ok: true, status: 'connected', latencyMs: 45, message: 'Supabase connected' },
  };
  res.json(results[name] || { ok: false, status: 'unknown', latencyMs: null, message: `Unknown provider: ${name}` });
});

// GET /revenue-summary — Revenue Cockpit (requires finance.view)
router.get('/revenue-summary', authenticate, requirePermission('finance.view'), (req, res) => {
  res.json({ today: 3850, week: 22100, month: 89200, flights: 71250, hotels: 8450, marketplace: 3250, ads: 1800, markup: 4460, markupPct: 5, currency: 'USD' });
});

// GET /revenue-by-currency (requires finance.view)
router.get('/revenue-by-currency', authenticate, requirePermission('finance.view'), (req, res) => {
  res.json({
    byCurrency: [
      { currency: 'USD', totalRevenue: 52300, bookings: 312, markupRevenue: 2615 },
      { currency: 'AUD', totalRevenue: 18450, bookings: 98, markupRevenue: 922 },
      { currency: 'EUR', totalRevenue: 6200, bookings: 35, markupRevenue: 310 },
      { currency: 'SGD', totalRevenue: 4800, bookings: 28, markupRevenue: 240 },
      { currency: 'IDR', totalRevenue: 3000, bookings: 419, markupRevenue: 373 },
    ],
    totalMarkup: 4460, markupPct: 5,
  });
});

// GET /app-users — User Management (requires users.view)
router.get('/app-users', authenticate, requirePermission('users.view'), (req, res) => {
  res.json({
    users: [
      { id: 'USR-001', email: 'joao@example.com', lang: 'tetun', tier: 'premium', chatToday: 45, voiceToday: 3, totalChats: 234, lastActive: new Date().toISOString(), premiumUntil: new Date(Date.now() + 30*86400000).toISOString(), banned: false, registeredAt: new Date(Date.now() - 90*86400000).toISOString() },
      { id: 'USR-002', email: 'maria@example.com', lang: 'indonesian', tier: 'free', chatToday: 12, voiceToday: 0, totalChats: 89, lastActive: new Date(Date.now() - 86400000).toISOString(), premiumUntil: null, banned: false, registeredAt: new Date(Date.now() - 60*86400000).toISOString() },
      { id: 'USR-003', email: 'budi@example.com', lang: 'english', tier: 'premium', chatToday: 0, voiceToday: 0, totalChats: 456, lastActive: new Date(Date.now() - 7*86400000).toISOString(), premiumUntil: new Date(Date.now() - 2*86400000).toISOString(), banned: false, registeredAt: new Date(Date.now() - 120*86400000).toISOString() },
      { id: 'USR-004', email: 'spammer@test.com', lang: 'tetun', tier: 'free', chatToday: 340, voiceToday: 10, totalChats: 1200, lastActive: new Date().toISOString(), premiumUntil: null, banned: true, registeredAt: new Date(Date.now() - 5*86400000).toISOString() },
    ]
  });
});

// POST /app-users/set-premium (requires users.premium)
router.post('/app-users/set-premium', authenticate, requirePermission('users.premium'), (req, res) => {
  const { id, days } = req.body;
  res.json({ success: true, id, days, message: `User ${id} set to premium for ${days} days` });
});

// POST /app-users/reset-limit (requires users.edit)
router.post('/app-users/reset-limit', authenticate, requirePermission('users.edit'), (req, res) => {
  const { id, cancel } = req.body;
  res.json({ success: true, id, message: cancel ? 'Premium cancelled' : 'Limit reset' });
});

// POST /app-users/ban (requires users.ban)
router.post('/app-users/ban', authenticate, requirePermission('users.ban'), (req, res) => {
  const { id } = req.body;
  res.json({ success: true, id, message: 'User banned' });
});

// POST /app-users/unban (requires users.ban)
router.post('/app-users/unban', authenticate, requirePermission('users.ban'), (req, res) => {
  const { id } = req.body;
  res.json({ success: true, id, message: 'User unbanned' });
});

// GET /hotels — Hotel Partners (requires hotels.view)
router.get('/hotels', authenticate, requirePermission('hotels.view'), (req, res) => {
  res.json({ hotels: [
    { id: 'HTL-001', name: 'Hotel Timor', country: 'Timor-Leste', city: 'Dili', rooms: 45, status: 'active' },
    { id: 'HTL-002', name: 'Bali Paradise Resort', country: 'Indonesia', city: 'Denpasar', rooms: 120, status: 'active' },
    { id: 'HTL-003', name: 'Kupang Plaza Hotel', country: 'Indonesia', city: 'Kupang', rooms: 35, status: 'pending' },
  ]});
});

router.post('/hotels', authenticate, requirePermission('hotels.edit'), (req, res) => {
  res.json({ success: true, id: 'HTL-' + Date.now(), message: 'Hotel added' });
});

// GET /promos — Promo Codes (requires promos.view)
router.get('/promos', authenticate, requirePermission('promos.view'), (req, res) => {
  res.json({ promos: [
    { code: 'WELCOME10', discount: 10, type: 'percentage', usage: 45, maxUses: 100, expiry: '2026-12-31', status: 'active' },
    { code: 'FLASH50', discount: 50, type: 'percentage', usage: 12, maxUses: 50, expiry: '2026-07-15', status: 'active' },
    { code: 'VIP200', discount: 200, type: 'fixed', usage: 3, maxUses: 20, expiry: '2026-06-01', status: 'expired' },
    { code: 'SUMMER25', discount: 25, type: 'percentage', usage: 78, maxUses: 200, expiry: '2026-09-30', status: 'active' },
  ]});
});

router.post('/promos', authenticate, requirePermission('promos.edit'), (req, res) => {
  res.json({ success: true, code: req.body.code || 'NEW-PROMO', message: 'Promo created' });
});

// GET /flash-deals — Flash Deals (requires deals.view)
router.get('/flash-deals', authenticate, requirePermission('deals.view'), (req, res) => {
  res.json({ deals: [
    { id: 'DL01', title: 'Dili Weekend', route: 'DIL-DPS', discount: 25, start: '2026-06-21', end: '2026-06-28', status: 'active', revenue: 1200 },
    { id: 'DL02', title: 'Kupang Special', route: 'DIL-KOE', discount: 30, start: '2026-07-01', end: '2026-07-15', status: 'scheduled', revenue: 0 },
    { id: 'DL03', title: 'Summer Bali', route: 'DIL-DPS', discount: 15, start: '2026-05-01', end: '2026-05-15', status: 'expired', revenue: 3400 },
  ]});
});

router.post('/flash-deals', authenticate, requirePermission('deals.edit'), (req, res) => {
  res.json({ success: true, id: 'DL-' + Date.now(), message: 'Deal created' });
});

// GET /market/listings — Market Monitor (requires market.view)
router.get('/market/listings', authenticate, requirePermission('market.view'), (req, res) => {
  res.json({ listings: [
    { id: 'L01', seller: 'Joao S.', category: 'Vehicles', title: 'Toyota Hilux 2020', price: 18500, status: 'active', created: '2026-06-20' },
    { id: 'L02', seller: 'Maria S.', category: 'Property', title: 'House Dili Center', price: 45000, status: 'active', created: '2026-06-19' },
    { id: 'L03', seller: 'Antonio C.', category: 'Electronics', title: 'iPhone 14 Pro', price: 900, status: 'pending', created: '2026-06-21' },
    { id: 'L04', seller: 'Ana R.', category: 'Tourism', title: 'Dili City Tour', price: 25, status: 'active', created: '2026-06-18' },
    { id: 'L05', seller: 'Paulo M.', category: 'Services', title: 'Translation Tetun', price: 15, status: 'suspended', created: '2026-06-15' },
    { id: 'L06', seller: 'Lisa F.', category: 'Jobs', title: 'Admin Remote', price: 400, status: 'active', created: '2026-06-17' },
  ]});
});

// GET /market/messages — Market Messages (requires market.messages)
router.get('/market/messages', authenticate, requirePermission('market.messages'), (req, res) => {
  res.json({ conversations: [
    { id: 'M01', buyer: 'Carlos M.', seller: 'Joao S.', listing: 'Toyota Hilux', lastMsg: 'Is this still available?', status: 'open', flagged: false, time: '2026-06-21 08:30' },
    { id: 'M02', buyer: 'Ana R.', seller: 'Maria S.', listing: 'House Dili', lastMsg: 'Can I see the house tomorrow?', status: 'open', flagged: false, time: '2026-06-21 09:15' },
    { id: 'M03', buyer: '??', seller: 'Unknown', listing: '???', lastMsg: 'Send money to this account...', status: 'flagged', flagged: true, time: '2026-06-21 07:00' },
    { id: 'M04', buyer: 'Paulo M.', seller: 'Lisa F.', listing: 'Admin Job', lastMsg: "I'll send resume tonight", status: 'closed', flagged: false, time: '2026-06-20 18:00' },
  ]});
});

// GET /explore/posts — Explore Monitor (requires content.view)
router.get('/explore/posts', authenticate, requirePermission('content.view'), (req, res) => {
  res.json({ posts: [
    { id: 'P01', user: 'Joao S.', title: 'Best Beaches in Timor-Leste', category: 'Tourism', views: 1250, likes: 340, status: 'published', reported: false },
    { id: 'P02', user: 'Maria S.', title: 'How to Cook Ikan Pepes', category: 'Food', views: 890, likes: 210, status: 'published', reported: false },
    { id: 'P03', user: '??', title: 'Click here for free money', category: 'Spam', views: 45, likes: 2, status: 'pending', reported: true },
    { id: 'P04', user: 'Ana R.', title: 'Dili City Photography', category: 'Photography', views: 2100, likes: 560, status: 'published', reported: false },
    { id: 'P05', user: 'Paulo M.', title: 'Copyrighted movie download', category: 'Movies', views: 120, likes: 5, status: 'removed', reported: true },
  ]});
});

// GET /cqap/score — QA Platform (requires qa.view)
router.get('/cqap/score', authenticate, requirePermission('qa.view'), (req, res) => {
  res.json({ otaScore: 87, otaStatus: 'PRODUCTION_READY', passRate: 93, regressionDetected: false, activeRun: false, createdAt: new Date().toISOString(),
    categoryScores: { 'Flight Search': 95, 'Booking Flow': 91, 'Payment': 88, 'Support': 92, 'Multilingual': 85 }
  });
});

// POST /cqap/trigger — Trigger QA run (requires qa.trigger)
router.post('/cqap/trigger', authenticate, requirePermission('qa.trigger'), (req, res) => {
  res.json({ success: true, runId: 'QA-' + Date.now() });
});

// GET /ota-live-score — OTA Live Score Widget (requires qa.view)
router.get('/ota-live-score', authenticate, requirePermission('qa.view'), (req, res) => {
  res.json({ otaStatus: 'PRODUCTION_READY', flightAccuracy: 97.5, qaBenchmark: { passRate: 93, total: 30, passed: 28 }, dilCorrectionRate: 0.8, smartDateResolver: 'ACTIVE', antiHallucinationLayer: 'ACTIVE', countryMappings: 21, recentMismatches: [] });
});

// GET /ai-status — AI Intelligence (requires chat.view)
router.get('/ai-status', authenticate, requirePermission('chat.view'), (req, res) => {
  const now = new Date().toISOString();
  res.json({
    providers: [
      { name: 'OpenRouter', status: 'online', model: 'qwen3-coder-next', latency: 156 },
      { name: 'OpenAI', status: 'online', model: 'gpt-4o-mini', latency: 234 },
      { name: 'Gemini', status: 'online', model: 'gemini-2.0-flash', latency: 189 },
      { name: 'Groq', status: 'offline', model: 'llama-3.3-70b', latency: null },
      { name: 'Cloudflare AI', status: 'online', model: 'llama-3.1-8b', latency: 98 },
    ],
    apiCallsToday: 2156, tokenUsageToday: 2840000, avgLatencyMs: 169, fallbackCount: 12,
    topIntents: [
      { name: 'Flight Search', value: 845 }, { name: 'Booking', value: 423 },
      { name: 'Visa Info', value: 312 }, { name: 'Pricing', value: 289 }, { name: 'Support', value: 287 },
    ],
    rateLimitStatus: [
      { provider: 'OpenRouter', used: 42 }, { provider: 'OpenAI', used: 55 },
      { provider: 'Gemini', used: 41 }, { provider: 'Cloudflare AI', used: 73 },
    ],
    lastChecked: now,
  });
});

// GET /api-providers — API Provider Center (alias, requires api_keys.view)
router.get('/api-providers', authenticate, requirePermission('api_keys.view'), (req, res) => {
  const providers = [
    { name: 'Travelport', label: 'Travelport', category: 'Travel', configured: true, masked: 'trav***23', status: 'online', latency: 287, errors: 2, quotaUsage: 42 },
    { name: 'PKFARE', label: 'PKFARE', category: 'Travel', configured: true, masked: 'pkfa***89', status: 'online', latency: 412, errors: 0, quotaUsage: 28 },
    { name: 'OpenRouter', label: 'OpenRouter', category: 'AI', configured: true, masked: 'open***45', status: 'online', latency: 156, errors: 1, quotaUsage: 67 },
    { name: 'OpenAI', label: 'OpenAI', category: 'AI', configured: true, masked: 'sk-p***abc', status: 'online', latency: 234, errors: 0, quotaUsage: 55 },
    { name: 'Gemini', label: 'Gemini', category: 'AI', configured: true, masked: 'AIza***xyz', status: 'online', latency: 189, errors: 0, quotaUsage: 41 },
    { name: 'Groq', label: 'Groq', category: 'AI', configured: false, masked: 'gsk-***---', status: 'offline', latency: 0, errors: 0, quotaUsage: 0 },
    { name: 'Cloudflare AI', label: 'Cloudflare AI', category: 'AI', configured: true, masked: 'cf-***78', status: 'online', latency: 98, errors: 3, quotaUsage: 73 },
    { name: 'Supabase', label: 'Supabase', category: 'APIs', configured: true, masked: 'sup***56', status: 'online', latency: 45, errors: 0, quotaUsage: 34 },
  ];
  res.json({ keys: providers, totalConfigured: providers.filter(p => p.configured).length, totalKeys: providers.length });
});

// POST /fraud/review/:id — Fraud review action (requires bookings.fraud)
router.post('/fraud/review/:id', authenticate, requirePermission('bookings.fraud'), (req, res) => {
  const { action } = req.body;
  res.json({ success: true, id: req.params.id, action, message: `Booking ${req.params.id} ${action}d` });
});

// POST /test/run — System test (requires qa.trigger)
router.post('/test/run', authenticate, requirePermission('qa.trigger'), (req, res) => {
  res.json({
    summary: { passed: 28, failed: 1, warned: 2 }, duration: 1245,
    results: [
      { name: 'API Connectivity', status: 'pass', detail: 'All providers responding', latencyMs: 156 },
      { name: 'Database Connection', status: 'pass', detail: 'PostgreSQL connected', latencyMs: 12 },
      { name: 'Flight Search API', status: 'pass', detail: 'Travelport uAPI healthy', latencyMs: 287 },
      { name: 'Payment Gateway', status: 'pass', detail: 'Stripe/PayPal ready', latencyMs: 45 },
      { name: 'WhatsApp API', status: 'warn', detail: 'Rate limit at 80%', latencyMs: 230 },
      { name: 'Email Service', status: 'pass', detail: 'SMTP configured', latencyMs: 89 },
      { name: 'AI Provider Failover', status: 'fail', detail: 'Groq still offline', latencyMs: null },
    ]
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FLIGHT ROUTE NETWORK — Public endpoint for FlightRoutesMap.tsx
// Complete per-country airport and route coverage
// ═══════════════════════════════════════════════════════════════════════════
router.get('/flight-network', (req, res) => {
  const airports = [
    // ── Timor-Leste (5 airports) ──
    { iata: 'DIL', name: 'Presidente Nicolau dos Santos Lobato International Airport', city: 'Dili', country: 'Timor-Leste', lat: -8.5464, lon: 125.5247, region: 'Timor-Leste' },
    { iata: 'BCH', name: 'Cakung Airport', city: 'Baucau', country: 'Timor-Leste', lat: -8.4894, lon: 126.3983, region: 'Timor-Leste' },
    { iata: 'OEC', name: 'Rota do Sândalo Airport (Oecusse)', city: 'Oecusse', country: 'Timor-Leste', lat: -9.2033, lon: 124.3417, region: 'Timor-Leste' },
    { iata: 'MPT', name: 'Maliana Airport', city: 'Maliana', country: 'Timor-Leste', lat: -8.9075, lon: 125.1408, region: 'Timor-Leste' },
    { iata: 'UAI', name: 'Suai Airport', city: 'Suai', country: 'Timor-Leste', lat: -9.3008, lon: 125.2886, region: 'Timor-Leste' },
    // ── Indonesia — Southeast Asia (12 airports) ──
    { iata: 'KUP', name: 'El Tari International Airport', city: 'Kupang', country: 'Indonesia', lat: -10.1716, lon: 123.6711, region: 'Southeast Asia' },
    { iata: 'KOE', name: 'El Tari Airport (KUP dup)', city: 'Kupang', country: 'Indonesia', lat: -10.1708, lon: 123.6708, region: 'Southeast Asia' },
    { iata: 'SOF', name: 'Soa Airport', city: 'Bajawa', country: 'Indonesia', lat: -8.8856, lon: 121.0333, region: 'Southeast Asia' },
    { iata: 'LBJ', name: 'Komodo Airport', city: 'Labuan Bajo', country: 'Indonesia', lat: -8.4867, lon: 119.8894, region: 'Southeast Asia' },
    { iata: 'MOF', name: 'Maumere Airport', city: 'Maumere', country: 'Indonesia', lat: -8.6394, lon: 122.2417, region: 'Southeast Asia' },
    { iata: 'DPS', name: 'Ngurah Rai International Airport', city: 'Denpasar / Bali', country: 'Indonesia', lat: -8.7483, lon: 115.1675, region: 'Southeast Asia' },
    { iata: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', lat: -6.1258, lon: 106.6558, region: 'Southeast Asia' },
    { iata: 'SUB', name: 'Juanda International Airport', city: 'Surabaya', country: 'Indonesia', lat: -7.3798, lon: 112.7869, region: 'Southeast Asia' },
    { iata: 'UPG', name: 'Sultan Hasanuddin International Airport', city: 'Makassar', country: 'Indonesia', lat: -5.0625, lon: 119.5464, region: 'Southeast Asia' },
    { iata: 'MDC', name: 'Sam Ratulangi International Airport', city: 'Manado', country: 'Indonesia', lat: 1.5494, lon: 124.9261, region: 'Southeast Asia' },
    { iata: 'PKU', name: 'Sultan Syarif Kasim II International Airport', city: 'Pekanbaru', country: 'Indonesia', lat: 0.4608, lon: 101.4445, region: 'Southeast Asia' },
    { iata: 'BPN', name: 'Sultan Aji Muhammad Sulaiman Airport', city: 'Balikpapan', country: 'Indonesia', lat: -1.2683, lon: 116.8944, region: 'Southeast Asia' },
    // ── Southeast Asia (8 countries) ──
    { iata: 'SIN', name: 'Changi International Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915, region: 'Southeast Asia' },
    { iata: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7092, region: 'Southeast Asia' },
    { iata: 'BKK', name: 'Suvarnabhumi International Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lon: 100.7501, region: 'Southeast Asia' },
    { iata: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', lat: 14.5086, lon: 121.0194, region: 'Southeast Asia' },
    { iata: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lon: 106.6519, region: 'Southeast Asia' },
    { iata: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam', lat: 21.2211, lon: 105.8072, region: 'Southeast Asia' },
    { iata: 'PNH', name: 'Phnom Penh International Airport', city: 'Phnom Penh', country: 'Cambodia', lat: 11.5466, lon: 104.8443, region: 'Southeast Asia' },
    { iata: 'RGN', name: 'Yangon International Airport', city: 'Yangon', country: 'Myanmar', lat: 16.9073, lon: 96.1332, region: 'Southeast Asia' },
    { iata: 'VTE', name: 'Wattay International Airport', city: 'Vientiane', country: 'Laos', lat: 17.9883, lon: 102.5633, region: 'Southeast Asia' },
    // ── East Asia (5 countries) ──
    { iata: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798, region: 'East Asia' },
    { iata: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7647, lon: 140.3864, region: 'East Asia' },
    { iata: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', lat: 34.4320, lon: 135.2304, region: 'East Asia' },
    { iata: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407, region: 'East Asia' },
    { iata: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China', lat: 31.1443, lon: 121.8083, region: 'East Asia' },
    { iata: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China', lat: 40.0799, lon: 116.6031, region: 'East Asia' },
    { iata: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China', lat: 23.3925, lon: 113.2988, region: 'East Asia' },
    { iata: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China', lat: 22.3080, lon: 113.9185, region: 'East Asia' },
    { iata: 'TPE', name: 'Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', lat: 25.0764, lon: 121.2238, region: 'East Asia' },
    // ── South Asia (5 countries) ──
    { iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', lat: 28.5562, lon: 77.1000, region: 'South Asia' },
    { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656, region: 'South Asia' },
    { iata: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', lat: 12.9941, lon: 80.1709, region: 'South Asia' },
    { iata: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', lat: 13.1979, lon: 77.7063, region: 'South Asia' },
    { iata: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', country: 'India', lat: 22.6547, lon: 88.4467, region: 'South Asia' },
    { iata: 'CMB', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', lat: 7.1811, lon: 79.8842, region: 'South Asia' },
    { iata: 'DAC', name: 'Shahjalal International Airport', city: 'Dhaka', country: 'Bangladesh', lat: 23.8436, lon: 90.3978, region: 'South Asia' },
    { iata: 'KHI', name: 'Jinnah International Airport', city: 'Karachi', country: 'Pakistan', lat: 24.9065, lon: 67.1608, region: 'South Asia' },
    { iata: 'ISB', name: 'Islamabad International Airport', city: 'Islamabad', country: 'Pakistan', lat: 33.5491, lon: 72.8232, region: 'South Asia' },
    { iata: 'KTM', name: 'Tribhuvan International Airport', city: 'Kathmandu', country: 'Nepal', lat: 27.6958, lon: 85.3591, region: 'South Asia' },
    // ── Oceania (5 countries) ──
    { iata: 'DRW', name: 'Darwin International Airport', city: 'Darwin', country: 'Australia', lat: -12.4080, lon: 130.8733, region: 'Oceania' },
    { iata: 'SYD', name: 'Kingsford Smith International Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753, region: 'Oceania' },
    { iata: 'MEL', name: 'Melbourne Airport (Tullamarine)', city: 'Melbourne', country: 'Australia', lat: -37.6733, lon: 144.8433, region: 'Oceania' },
    { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3842, lon: 153.1175, region: 'Oceania' },
    { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9400, lon: 115.9670, region: 'Oceania' },
    { iata: 'CBR', name: 'Canberra Airport', city: 'Canberra', country: 'Australia', lat: -35.3069, lon: 149.1951, region: 'Oceania' },
    { iata: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia', lat: -34.9450, lon: 138.5306, region: 'Oceania' },
    { iata: 'AKL', name: 'Auckland International Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0083, lon: 174.7917, region: 'Oceania' },
    { iata: 'CHC', name: 'Christchurch International Airport', city: 'Christchurch', country: 'New Zealand', lat: -43.4894, lon: 172.5350, region: 'Oceania' },
    { iata: 'WLG', name: 'Wellington International Airport', city: 'Wellington', country: 'New Zealand', lat: -41.3272, lon: 174.8050, region: 'Oceania' },
    { iata: 'NOU', name: 'La Tontouta International Airport', city: 'Nouméa', country: 'New Caledonia', lat: -22.0144, lon: 166.2130, region: 'Oceania' },
    { iata: 'POM', name: 'Jacksons International Airport', city: 'Port Moresby', country: 'Papua New Guinea', lat: -9.4400, lon: 147.2195, region: 'Oceania' },
    { iata: 'SUV', name: 'Nausori International Airport', city: 'Suva', country: 'Fiji', lat: -18.0433, lon: 178.5592, region: 'Oceania' },
    { iata: 'NAN', name: 'Nadi International Airport', city: 'Nadi', country: 'Fiji', lat: -17.7544, lon: 177.4436, region: 'Oceania' },
    { iata: 'APW', name: 'Faleolo International Airport', city: 'Apia', country: 'Samoa', lat: -13.8300, lon: -172.0083, region: 'Oceania' },
    { iata: 'PPT', name: `Faa'a International Airport`, city: 'Papeete', country: 'French Polynesia', lat: -17.5537, lon: -149.6077, region: 'Oceania' },
    // ── Middle East (7 countries) ──
    { iata: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657, region: 'Middle East' },
    { iata: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'UAE', lat: 24.4331, lon: 54.6508, region: 'Middle East' },
    { iata: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.6081, region: 'Middle East' },
    { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519, region: 'Middle East' },
    { iata: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9575, lon: 46.6989, region: 'Middle East' },
    { iata: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6797, lon: 39.1565, region: 'Middle East' },
    { iata: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', lat: 29.2266, lon: 47.9689, region: 'Middle East' },
    { iata: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', lat: 23.5933, lon: 58.2844, region: 'Middle East' },
    { iata: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', lat: 26.2708, lon: 50.6336, region: 'Middle East' },
    { iata: 'AMM', name: 'Queen Alia International Airport', city: 'Amman', country: 'Jordan', lat: 31.7228, lon: 35.9932, region: 'Middle East' },
    // ── Europe (15 countries) ──
    { iata: 'LIS', name: 'Humberto Delgado Airport (Lisbon)', city: 'Lisbon', country: 'Portugal', lat: 38.7742, lon: -9.1342, region: 'Europe' },
    { iata: 'OPO', name: 'Francisco de Sá Carneiro Airport', city: 'Porto', country: 'Portugal', lat: 41.2389, lon: -8.6714, region: 'Europe' },
    { iata: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal', lat: 37.0144, lon: -7.9658, region: 'Europe' },
    { iata: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543, region: 'Europe' },
    { iata: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1481, lon: -0.1903, region: 'Europe' },
    { iata: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5478, region: 'Europe' },
    { iata: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683, region: 'Europe' },
    { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0333, lon: 8.5706, region: 'Europe' },
    { iata: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', lat: 52.3667, lon: 13.5033, region: 'Europe' },
    { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3538, lon: 11.7861, region: 'Europe' },
    { iata: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4936, lon: -3.5668, region: 'Europe' },
    { iata: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain', lat: 41.2971, lon: 2.0785, region: 'Europe' },
    { iata: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389, region: 'Europe' },
    { iata: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', lat: 45.6301, lon: 8.7280, region: 'Europe' },
    { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4647, lon: 8.5492, region: 'Europe' },
    { iata: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', lat: 48.1103, lon: 16.5697, region: 'Europe' },
    { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9014, lon: 4.4844, region: 'Europe' },
    { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.6181, lon: 12.6561, region: 'Europe' },
    { iata: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lon: 17.9238, region: 'Europe' },
    { iata: 'OSL', name: 'Oslo Airport, Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1942, lon: 11.1003, region: 'Europe' },
    { iata: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', lat: 60.3172, lon: 24.9633, region: 'Europe' },
    { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4213, lon: -6.2701, region: 'Europe' },
    { iata: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', lat: 52.1657, lon: 20.9671, region: 'Europe' },
    { iata: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', lat: 50.1008, lon: 14.2600, region: 'Europe' },
    { iata: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest', country: 'Hungary', lat: 47.4300, lon: 19.2611, region: 'Europe' },
    { iata: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', lat: 37.9364, lon: 23.9472, region: 'Europe' },
    // ── Africa (10 countries) ──
    { iata: 'JNB', name: 'O. R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', lat: -26.1333, lon: 28.2417, region: 'Africa' },
    { iata: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', lat: -33.9648, lon: 18.6017, region: 'Africa' },
    { iata: 'DUR', name: 'King Shaka International Airport', city: 'Durban', country: 'South Africa', lat: -29.6144, lon: 31.1197, region: 'Africa' },
    { iata: 'ADD', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9778, lon: 38.7994, region: 'Africa' },
    { iata: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya', lat: -1.3194, lon: 36.9278, region: 'Africa' },
    { iata: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria', lat: 6.5774, lon: 3.3210, region: 'Africa' },
    { iata: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', lat: 30.1219, lon: 31.4056, region: 'Africa' },
    { iata: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', lat: 33.3675, lon: -7.5898, region: 'Africa' },
    { iata: 'DAR', name: 'Julius Nyerere International Airport', city: 'Dar es Salaam', country: 'Tanzania', lat: -6.8781, lon: 39.2026, region: 'Africa' },
    { iata: 'ACC', name: 'Kotoka International Airport', city: 'Accra', country: 'Ghana', lat: 5.6052, lon: -0.1668, region: 'Africa' },
    { iata: 'LUN', name: 'Kenneth Kaunda International Airport', city: 'Lusaka', country: 'Zambia', lat: -15.3308, lon: 28.4525, region: 'Africa' },
    { iata: 'MBA', name: 'Moi International Airport', city: 'Mombasa', country: 'Kenya', lat: -4.0348, lon: 39.5942, region: 'Africa' },
    // ── Americas (8 countries) ──
    { iata: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085, region: 'Americas' },
    { iata: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781, region: 'Americas' },
    { iata: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.3790, region: 'Americas' },
    { iata: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', lat: 41.9800, lon: -87.9047, region: 'Americas' },
    { iata: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', lat: 25.7955, lon: -80.2870, region: 'Americas' },
    { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States', lat: 33.6407, lon: -84.4277, region: 'Americas' },
    { iata: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', lat: 47.4502, lon: -122.3088, region: 'Americas' },
    { iata: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', lat: 39.8561, lon: -104.6737, region: 'Americas' },
    { iata: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248, region: 'Americas' },
    { iata: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1967, lon: -123.1815, region: 'Americas' },
    { iata: 'YUL', name: 'Montréal–Trudeau International Airport', city: 'Montreal', country: 'Canada', lat: 45.4706, lon: -73.7408, region: 'Americas' },
    { iata: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lon: -46.4731, region: 'Americas' },
    { iata: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8092, lon: -43.2483, region: 'Americas' },
    { iata: 'BSB', name: 'Brasília International Airport', city: 'Brasília', country: 'Brazil', lat: -15.8697, lon: -47.9197, region: 'Americas' },
    { iata: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719, region: 'Americas' },
    { iata: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', lat: 4.7019, lon: -74.1469, region: 'Americas' },
    { iata: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', lat: -33.3930, lon: -70.7861, region: 'Americas' },
    { iata: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', lat: -34.8217, lon: -58.5358, region: 'Americas' },
    { iata: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', lat: -12.0219, lon: -77.1144, region: 'Americas' },
    { iata: 'PTY', name: 'Tocumen International Airport', city: 'Panama City', country: 'Panama', lat: 9.0714, lon: -79.3833, region: 'Americas' },
    { iata: 'SJO', name: 'Juan Santamaría International Airport', city: 'San José', country: 'Costa Rica', lat: 9.9939, lon: -84.2089, region: 'Americas' },
    { iata: 'HAV', name: 'José Martí International Airport', city: 'Havana', country: 'Cuba', lat: 22.9892, lon: -82.4091, region: 'Americas' },
  ];

  const routes = [
    // ══════════════════════════════════════
    // DILI HUB — routes from/to DIL
    // ══════════════════════════════════════
    { from: 'DIL', to: 'KUP', airlines: ['Citilink', 'Garuda Indonesia'], priceFrom: 55, priceTo: 90, currency: 'USD', duration: '45m', frequency: 'Daily' },
    { from: 'DIL', to: 'DRW', airlines: ['Virgin Australia', 'Qantas'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'DIL', to: 'DPS', airlines: ['Citilink', 'Garuda Indonesia'], priceFrom: 150, priceTo: 350, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'DIL', to: 'CGK', airlines: ['Garuda Indonesia', 'Citilink'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'DIL', to: 'SIN', airlines: ['Singapore Airlines', 'Scoot'], priceFrom: 280, priceTo: 500, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'DIL', to: 'KUL', airlines: ['AirAsia', 'Malaysia Airlines'], priceFrom: 250, priceTo: 450, currency: 'USD', duration: '3h 15m', frequency: 'Weekly' },
    { from: 'DIL', to: 'BKK', airlines: ['Thai Airways'], priceFrom: 300, priceTo: 550, currency: 'USD', duration: '4h 00m', frequency: 'Weekly' },
    { from: 'DIL', to: 'LIS', airlines: ['TAP Air Portugal'], priceFrom: 800, priceTo: 1400, currency: 'USD', duration: '17h 00m', frequency: 'Weekly', via: ['DRW', 'DPS'] },
    { from: 'DIL', to: 'DXB', airlines: ['Emirates', 'Qatar Airways'], priceFrom: 600, priceTo: 1100, currency: 'USD', duration: '12h 00m', frequency: 'Bi-weekly', via: ['DRW'] },
    { from: 'DIL', to: 'DOH', airlines: ['Qatar Airways'], priceFrom: 550, priceTo: 1000, currency: 'USD', duration: '11h 00m', frequency: 'Weekly', via: ['DRW'] },
    { from: 'DIL', to: 'HKG', airlines: ['Cathay Pacific'], priceFrom: 350, priceTo: 650, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    { from: 'DIL', to: 'NRT', airlines: ['Japan Airlines'], priceFrom: 500, priceTo: 900, currency: 'USD', duration: '7h 00m', frequency: 'Weekly', via: ['SIN'] },
    // ── Kupang hub (NTT region) ──
    { from: 'KUP', to: 'DIL', airlines: ['Citilink', 'Garuda Indonesia'], priceFrom: 55, priceTo: 90, currency: 'USD', duration: '45m', frequency: 'Daily' },
    { from: 'KUP', to: 'SOF', airlines: ['Wings Air'], priceFrom: 35, priceTo: 65, currency: 'USD', duration: '45m', frequency: 'Daily' },
    { from: 'KUP', to: 'LBJ', airlines: ['Wings Air', 'Citilink'], priceFrom: 45, priceTo: 80, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'KUP', to: 'MOF', airlines: ['Wings Air'], priceFrom: 30, priceTo: 55, currency: 'USD', duration: '40m', frequency: 'Daily' },
    { from: 'KUP', to: 'DPS', airlines: ['Citilink', 'Garuda Indonesia', 'Lion Air'], priceFrom: 70, priceTo: 130, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'KUP', to: 'SUB', airlines: ['Citilink', 'Lion Air'], priceFrom: 55, priceTo: 100, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'KUP', to: 'CGK', airlines: ['Garuda Indonesia', 'Citilink'], priceFrom: 100, priceTo: 200, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'KUP', to: 'UPG', airlines: ['Lion Air'], priceFrom: 70, priceTo: 120, currency: 'USD', duration: '1h 45m', frequency: 'Weekly' },
    { from: 'KUP', to: 'DRW', airlines: ['Virgin Australia'], priceFrom: 150, priceTo: 280, currency: 'USD', duration: '1h 45m', frequency: 'Weekly' },
    { from: 'KUP', to: 'BPN', airlines: ['Lion Air'], priceFrom: 80, priceTo: 150, currency: 'USD', duration: '2h 00m', frequency: 'Weekly' },
    // ── Domestic Timor-Leste ──
    { from: 'DIL', to: 'BCH', airlines: ['MAF', 'Aero Dili'], priceFrom: 25, priceTo: 50, currency: 'USD', duration: '30m', frequency: 'Charter' },
    { from: 'DIL', to: 'OEC', airlines: ['MAF', 'Aero Dili'], priceFrom: 30, priceTo: 55, currency: 'USD', duration: '30m', frequency: 'Charter' },
    { from: 'DIL', to: 'MPT', airlines: ['MAF'], priceFrom: 20, priceTo: 40, currency: 'USD', duration: '25m', frequency: 'Charter' },
    { from: 'DIL', to: 'UAI', airlines: ['MAF'], priceFrom: 25, priceTo: 45, currency: 'USD', duration: '30m', frequency: 'Charter' },
    // ══════════════════════════════════════
    // AUSTRALIA & NZ (Oceania)
    // ══════════════════════════════════════
    { from: 'DRW', to: 'DIL', airlines: ['Virgin Australia', 'Qantas'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'DRW', to: 'KUP', airlines: ['Virgin Australia'], priceFrom: 150, priceTo: 280, currency: 'USD', duration: '1h 45m', frequency: 'Weekly' },
    { from: 'DRW', to: 'DPS', airlines: ['Jetstar', 'Virgin Australia'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '2h 45m', frequency: 'Weekly' },
    { from: 'DRW', to: 'SIN', airlines: ['Singapore Airlines', 'Scoot'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'DRW', to: 'SYD', airlines: ['Qantas', 'Virgin Australia'], priceFrom: 300, priceTo: 550, currency: 'USD', duration: '3h 45m', frequency: 'Daily' },
    { from: 'DRW', to: 'MEL', airlines: ['Qantas', 'Virgin Australia'], priceFrom: 280, priceTo: 500, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'DRW', to: 'BNE', airlines: ['Qantas', 'Jetstar'], priceFrom: 270, priceTo: 480, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'DRW', to: 'PER', airlines: ['Qantas'], priceFrom: 200, priceTo: 380, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'DRW', to: 'POM', airlines: ['Air Niugini'], priceFrom: 250, priceTo: 480, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'SYD', to: 'MEL', airlines: ['Qantas', 'Virgin Australia', 'Jetstar'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'SYD', to: 'BNE', airlines: ['Qantas', 'Virgin Australia'], priceFrom: 70, priceTo: 150, currency: 'USD', duration: '1h 20m', frequency: 'Daily' },
    { from: 'SYD', to: 'CBR', airlines: ['Qantas'], priceFrom: 60, priceTo: 130, currency: 'USD', duration: '55m', frequency: 'Daily' },
    { from: 'SYD', to: 'ADL', airlines: ['Qantas', 'Virgin Australia'], priceFrom: 90, priceTo: 180, currency: 'USD', duration: '1h 50m', frequency: 'Daily' },
    { from: 'SYD', to: 'AKL', airlines: ['Air New Zealand', 'Qantas'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'SYD', to: 'CHC', airlines: ['Air New Zealand'], priceFrom: 180, priceTo: 350, currency: 'USD', duration: '3h 15m', frequency: 'Weekly' },
    { from: 'SYD', to: 'NOU', airlines: ['Qantas', 'Air Calédonie'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'SYD', to: 'NAN', airlines: ['Fiji Airways', 'Qantas'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '4h 00m', frequency: 'Weekly' },
    { from: 'SYD', to: 'LAX', airlines: ['United', 'Delta', 'Qantas'], priceFrom: 500, priceTo: 900, currency: 'USD', duration: '15h 00m', frequency: 'Daily' },
    { from: 'SYD', to: 'SFO', airlines: ['United', 'Qantas'], priceFrom: 520, priceTo: 950, currency: 'USD', duration: '14h 30m', frequency: 'Daily' },
    { from: 'SYD', to: 'HND', airlines: ['Qantas', 'Japan Airlines'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'SYD', to: 'ICN', airlines: ['Qantas', 'Korean Air'], priceFrom: 380, priceTo: 700, currency: 'USD', duration: '10h 00m', frequency: 'Daily' },
    { from: 'SYD', to: 'PVG', airlines: ['Qantas', 'China Eastern'], priceFrom: 350, priceTo: 650, currency: 'USD', duration: '11h 00m', frequency: 'Weekly' },
    { from: 'SYD', to: 'SIN', airlines: ['Qantas', 'Singapore Airlines'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'MEL', to: 'BNE', airlines: ['Qantas', 'Jetstar'], priceFrom: 75, priceTo: 160, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'MEL', to: 'ADL', airlines: ['Qantas', 'Jetstar'], priceFrom: 65, priceTo: 140, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'MEL', to: 'AKL', airlines: ['Air New Zealand', 'Qantas'], priceFrom: 160, priceTo: 320, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'MEL', to: 'LAX', airlines: ['United', 'Qantas'], priceFrom: 480, priceTo: 900, currency: 'USD', duration: '15h 30m', frequency: 'Daily' },
    { from: 'MEL', to: 'SIN', airlines: ['Singapore Airlines', 'Qantas'], priceFrom: 260, priceTo: 500, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'BNE', to: 'AKL', airlines: ['Air New Zealand', 'Qantas'], priceFrom: 140, priceTo: 280, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'BNE', to: 'NOU', airlines: ['Air Calédonie', 'Qantas'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '2h 45m', frequency: 'Weekly' },
    { from: 'BNE', to: 'POM', airlines: ['Air Niugini', 'Qantas'], priceFrom: 220, priceTo: 420, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'BNE', to: 'NAN', airlines: ['Fiji Airways'], priceFrom: 230, priceTo: 450, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'PER', to: 'SIN', airlines: ['Singapore Airlines', 'Scoot'], priceFrom: 180, priceTo: 350, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'PER', to: 'KUL', airlines: ['AirAsia', 'Malaysia Airlines'], priceFrom: 160, priceTo: 320, currency: 'USD', duration: '5h 15m', frequency: 'Weekly' },
    { from: 'PER', to: 'DRW', airlines: ['Qantas', 'Virgin Australia'], priceFrom: 200, priceTo: 380, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'PER', to: 'CGK', airlines: ['Garuda Indonesia'], priceFrom: 190, priceTo: 360, currency: 'USD', duration: '4h 00m', frequency: 'Weekly' },
    { from: 'PER', to: 'AKL', airlines: ['Air New Zealand'], priceFrom: 350, priceTo: 680, currency: 'USD', duration: '7h 00m', frequency: 'Weekly' },
    { from: 'AKL', to: 'CHC', airlines: ['Air New Zealand', 'Jetstar'], priceFrom: 40, priceTo: 90, currency: 'USD', duration: '1h 20m', frequency: 'Daily' },
    { from: 'AKL', to: 'WLG', airlines: ['Air New Zealand', 'Jetstar'], priceFrom: 35, priceTo: 80, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'AKL', to: 'NOU', airlines: ['Air New Zealand', 'Air Calédonie'], priceFrom: 180, priceTo: 350, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'AKL', to: 'NAN', airlines: ['Fiji Airways', 'Air New Zealand'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'AKL', to: 'LAX', airlines: ['Air New Zealand', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'AKL', to: 'SFO', airlines: ['Air New Zealand', 'United'], priceFrom: 470, priceTo: 880, currency: 'USD', duration: '12h 30m', frequency: 'Daily' },
    { from: 'AKL', to: 'SIN', airlines: ['Air New Zealand', 'Singapore Airlines'], priceFrom: 350, priceTo: 680, currency: 'USD', duration: '10h 30m', frequency: 'Weekly' },
    { from: 'AKL', to: 'HND', airlines: ['Air New Zealand', 'Japan Airlines'], priceFrom: 420, priceTo: 780, currency: 'USD', duration: '11h 00m', frequency: 'Weekly' },
    { from: 'POM', to: 'DRW', airlines: ['Air Niugini', 'Qantas'], priceFrom: 250, priceTo: 480, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'POM', to: 'NOU', airlines: ['Air Niugini', 'Air Calédonie'], priceFrom: 280, priceTo: 520, currency: 'USD', duration: '3h 15m', frequency: 'Weekly' },
    { from: 'POM', to: 'BNE', airlines: ['Air Niugini', 'Qantas'], priceFrom: 220, priceTo: 420, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'NAN', to: 'SUV', airlines: ['Fiji Airways'], priceFrom: 30, priceTo: 70, currency: 'USD', duration: '30m', frequency: 'Daily' },
    { from: 'NAN', to: 'AKL', airlines: ['Fiji Airways', 'Air New Zealand'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'NAN', to: 'LAX', airlines: ['Fiji Airways'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '10h 00m', frequency: 'Weekly' },
    { from: 'NAN', to: 'APW', airlines: ['Fiji Airways', 'Samoa Airways'], priceFrom: 180, priceTo: 350, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'PPT', to: 'AKL', airlines: ['Air New Zealand', 'Air Tahiti Nui'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'PPT', to: 'LAX', airlines: ['Air Tahiti Nui', 'French Bee'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '8h 00m', frequency: 'Weekly' },
    // ══════════════════════════════════════
    // SOUTHEAST ASIA
    // ══════════════════════════════════════
    { from: 'DPS', to: 'SIN', airlines: ['Singapore Airlines', 'Scoot', 'Garuda Indonesia'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'DPS', to: 'KUL', airlines: ['AirAsia', 'Malaysia Airlines'], priceFrom: 60, priceTo: 140, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'DPS', to: 'BKK', airlines: ['Thai Airways', 'AirAsia'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'DPS', to: 'HKG', airlines: ['Cathay Pacific', 'Hong Kong Airlines'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'DPS', to: 'MNL', airlines: ['Philippine Airlines', 'Cebu Pacific'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '3h 45m', frequency: 'Weekly' },
    { from: 'DPS', to: 'DIL', airlines: ['Citilink', 'Garuda Indonesia'], priceFrom: 150, priceTo: 350, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'DPS', to: 'CGK', airlines: ['Garuda Indonesia', 'Citilink', 'Lion Air'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'DPS', to: 'SUB', airlines: ['Citilink', 'Lion Air'], priceFrom: 30, priceTo: 70, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'DPS', to: 'UPG', airlines: ['Lion Air', 'Garuda Indonesia'], priceFrom: 50, priceTo: 110, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'DPS', to: 'DOH', airlines: ['Qatar Airways'], priceFrom: 320, priceTo: 600, currency: 'USD', duration: '9h 00m', frequency: 'Weekly' },
    { from: 'DPS', to: 'DXB', airlines: ['Emirates'], priceFrom: 350, priceTo: 650, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'DPS', to: 'IST', airlines: ['Turkish Airlines'], priceFrom: 380, priceTo: 700, currency: 'USD', duration: '11h 00m', frequency: 'Weekly' },
    { from: 'DPS', to: 'NRT', airlines: ['Japan Airlines', 'Garuda Indonesia'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '7h 00m', frequency: 'Weekly' },
    { from: 'DPS', to: 'ICN', airlines: ['Korean Air', 'Garuda Indonesia'], priceFrom: 260, priceTo: 520, currency: 'USD', duration: '6h 30m', frequency: 'Weekly' },
    { from: 'DPS', to: 'PVG', airlines: ['China Eastern', 'Garuda Indonesia'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '6h 00m', frequency: 'Weekly' },
    { from: 'DPS', to: 'SGN', airlines: ['VietJet', 'Garuda Indonesia'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'CGK', to: 'SIN', airlines: ['Singapore Airlines', 'Garuda Indonesia', 'AirAsia'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'CGK', to: 'KUL', airlines: ['AirAsia', 'Malaysia Airlines', 'Lion Air'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'BKK', airlines: ['Thai Airways', 'Garuda Indonesia'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'HKG', airlines: ['Cathay Pacific', 'Garuda Indonesia'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'UPG', airlines: ['Garuda Indonesia', 'Lion Air'], priceFrom: 70, priceTo: 140, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'MDC', airlines: ['Lion Air', 'Garuda Indonesia'], priceFrom: 90, priceTo: 180, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'CGK', to: 'BPN', airlines: ['Lion Air', 'Citilink'], priceFrom: 60, priceTo: 130, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'PKU', airlines: ['Lion Air', 'Garuda Indonesia'], priceFrom: 50, priceTo: 110, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'CGK', to: 'SUB', airlines: ['Garuda Indonesia', 'Citilink', 'Lion Air'], priceFrom: 35, priceTo: 80, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'CGK', to: 'DPS', airlines: ['Garuda Indonesia', 'Citilink', 'Lion Air'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'CGK', to: 'DOH', airlines: ['Qatar Airways'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'DXB', airlines: ['Emirates'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '8h 30m', frequency: 'Daily' },
    { from: 'CGK', to: 'NRT', airlines: ['Japan Airlines', 'Garuda Indonesia'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'ICN', airlines: ['Korean Air', 'Garuda Indonesia'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'CGK', to: 'PVG', airlines: ['China Eastern', 'Garuda Indonesia'], priceFrom: 260, priceTo: 520, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'CGK', to: 'MNL', airlines: ['Philippine Airlines', 'Cebu Pacific'], priceFrom: 130, priceTo: 260, currency: 'USD', duration: '4h 00m', frequency: 'Weekly' },
    { from: 'CGK', to: 'SGN', airlines: ['Vietnam Airlines', 'Garuda Indonesia'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'CGK', to: 'PER', airlines: ['Garuda Indonesia'], priceFrom: 190, priceTo: 360, currency: 'USD', duration: '4h 00m', frequency: 'Weekly' },
    { from: 'CGK', to: 'SYD', airlines: ['Garuda Indonesia', 'Qantas'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '6h 00m', frequency: 'Weekly' },
    { from: 'SIN', to: 'KUL', airlines: ['Singapore Airlines', 'AirAsia', 'Malaysia Airlines'], priceFrom: 30, priceTo: 80, currency: 'USD', duration: '55m', frequency: 'Daily' },
    { from: 'SIN', to: 'BKK', airlines: ['Singapore Airlines', 'Thai Airways'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'SIN', to: 'HKG', airlines: ['Singapore Airlines', 'Cathay Pacific'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '3h 45m', frequency: 'Daily' },
    { from: 'SIN', to: 'MNL', airlines: ['Singapore Airlines', 'Philippine Airlines'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'SIN', to: 'SGN', airlines: ['Singapore Airlines', 'Vietnam Airlines'], priceFrom: 70, priceTo: 160, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'HAN', airlines: ['Singapore Airlines', 'Vietnam Airlines'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '3h 15m', frequency: 'Daily' },
    { from: 'SIN', to: 'PNH', airlines: ['Singapore Airlines', 'Cambodia Angkor Air'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'RGN', airlines: ['Singapore Airlines', 'Myanmar Airways'], priceFrom: 110, priceTo: 230, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'SIN', to: 'HND', airlines: ['Singapore Airlines', 'Japan Airlines'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'SIN', to: 'ICN', airlines: ['Singapore Airlines', 'Korean Air'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'DXB', airlines: ['Emirates', 'Singapore Airlines'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'LHR', airlines: ['Singapore Airlines', 'British Airways'], priceFrom: 500, priceTo: 1000, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'CDG', airlines: ['Singapore Airlines', 'Air France'], priceFrom: 480, priceTo: 950, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'FRA', airlines: ['Singapore Airlines', 'Lufthansa'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '12h 30m', frequency: 'Daily' },
    { from: 'SIN', to: 'AMS', airlines: ['Singapore Airlines', 'KLM'], priceFrom: 470, priceTo: 920, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'SYD', airlines: ['Singapore Airlines', 'Qantas'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'MEL', airlines: ['Singapore Airlines', 'Qantas'], priceFrom: 260, priceTo: 500, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'SIN', to: 'PER', airlines: ['Singapore Airlines', 'Scoot'], priceFrom: 180, priceTo: 350, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'DRW', airlines: ['Singapore Airlines', 'Scoot'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'SIN', to: 'CMB', airlines: ['Singapore Airlines', 'SriLankan Airlines'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'SIN', to: 'DEL', airlines: ['Singapore Airlines', 'Air India'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'SIN', to: 'BOM', airlines: ['Singapore Airlines', 'Air India'], priceFrom: 190, priceTo: 380, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'SIN', to: 'DOH', airlines: ['Qatar Airways'], priceFrom: 220, priceTo: 450, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'KUL', to: 'BKK', airlines: ['AirAsia', 'Malaysia Airlines', 'Thai Airways'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'KUL', to: 'SIN', airlines: ['AirAsia', 'Malaysia Airlines', 'Singapore Airlines'], priceFrom: 30, priceTo: 80, currency: 'USD', duration: '55m', frequency: 'Daily' },
    { from: 'KUL', to: 'SGN', airlines: ['AirAsia', 'Vietnam Airlines'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'KUL', to: 'MNL', airlines: ['AirAsia', 'Philippine Airlines'], priceFrom: 60, priceTo: 140, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'KUL', to: 'HKG', airlines: ['Cathay Pacific', 'AirAsia'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'KUL', to: 'NRT', airlines: ['Malaysia Airlines', 'Japan Airlines'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '6h 30m', frequency: 'Weekly' },
    { from: 'KUL', to: 'ICN', airlines: ['Malaysia Airlines', 'Korean Air'], priceFrom: 260, priceTo: 520, currency: 'USD', duration: '6h 00m', frequency: 'Weekly' },
    { from: 'KUL', to: 'DXB', airlines: ['Emirates'], priceFrom: 220, priceTo: 450, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'KUL', to: 'LHR', airlines: ['Malaysia Airlines', 'British Airways'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'KUL', to: 'MEL', airlines: ['Malaysia Airlines', 'AirAsia X'], priceFrom: 240, priceTo: 480, currency: 'USD', duration: '7h 30m', frequency: 'Weekly' },
    { from: 'BKK', to: 'HKG', airlines: ['Cathay Pacific', 'Thai Airways'], priceFrom: 110, priceTo: 240, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'BKK', to: 'SGN', airlines: ['Thai Airways', 'Vietnam Airlines'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'BKK', to: 'HAN', airlines: ['Thai Airways', 'Vietnam Airlines'], priceFrom: 60, priceTo: 140, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'BKK', to: 'RGN', airlines: ['Thai Airways', 'Myanmar Airways'], priceFrom: 70, priceTo: 160, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'BKK', to: 'PNH', airlines: ['Thai Airways', 'Cambodia Angkor Air'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'BKK', to: 'DEL', airlines: ['Thai Airways', 'Air India'], priceFrom: 160, priceTo: 350, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'BKK', to: 'DXB', airlines: ['Emirates', 'Thai Airways'], priceFrom: 220, priceTo: 450, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'BKK', to: 'LHR', airlines: ['Thai Airways', 'British Airways'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'BKK', to: 'NRT', airlines: ['Thai Airways', 'Japan Airlines'], priceFrom: 260, priceTo: 520, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'BKK', to: 'ICN', airlines: ['Thai Airways', 'Korean Air'], priceFrom: 240, priceTo: 480, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'MNL', to: 'SGN', airlines: ['Philippine Airlines', 'Cebu Pacific'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'MNL', to: 'HKG', airlines: ['Cathay Pacific', 'Philippine Airlines'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'MNL', to: 'NRT', airlines: ['Philippine Airlines', 'Japan Airlines'], priceFrom: 240, priceTo: 480, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'MNL', to: 'ICN', airlines: ['Philippine Airlines', 'Korean Air'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'MNL', to: 'SYD', airlines: ['Philippine Airlines', 'Qantas'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '7h 30m', frequency: 'Weekly' },
    { from: 'SGN', to: 'HAN', airlines: ['Vietnam Airlines', 'VietJet'], priceFrom: 30, priceTo: 80, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'SGN', to: 'PNH', airlines: ['Vietnam Airlines', 'Cambodia Angkor Air'], priceFrom: 40, priceTo: 90, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'SGN', to: 'RGN', airlines: ['Vietnam Airlines'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'SGN', to: 'HKG', airlines: ['Vietnam Airlines', 'Cathay Pacific'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'SGN', to: 'ICN', airlines: ['Vietnam Airlines', 'Korean Air'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'SGN', to: 'NRT', airlines: ['Vietnam Airlines', 'Japan Airlines'], priceFrom: 220, priceTo: 440, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    // ══════════════════════════════════════
    // EAST ASIA
    // ══════════════════════════════════════
    { from: 'HND', to: 'NRT', airlines: ['Japan Airlines', 'ANA'], priceFrom: 40, priceTo: 90, currency: 'USD', duration: '45m', frequency: 'Daily' },
    { from: 'HND', to: 'KIX', airlines: ['Japan Airlines', 'ANA'], priceFrom: 60, priceTo: 130, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'HND', to: 'ICN', airlines: ['Japan Airlines', 'Korean Air', 'ANA'], priceFrom: 180, priceTo: 350, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'HND', to: 'PVG', airlines: ['ANA', 'China Eastern'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'HND', to: 'PEK', airlines: ['ANA', 'Air China'], priceFrom: 220, priceTo: 420, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'HND', to: 'HKG', airlines: ['Cathay Pacific', 'Japan Airlines'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'HND', to: 'TPE', airlines: ['Japan Airlines', 'China Airlines'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'HND', to: 'SIN', airlines: ['Japan Airlines', 'Singapore Airlines'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'HND', to: 'BKK', airlines: ['Japan Airlines', 'Thai Airways'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'HND', to: 'SYD', airlines: ['Japan Airlines', 'Qantas'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'HND', to: 'LAX', airlines: ['Japan Airlines', 'ANA'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '10h 00m', frequency: 'Daily' },
    { from: 'HND', to: 'SFO', airlines: ['Japan Airlines', 'United'], priceFrom: 460, priceTo: 870, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'NRT', to: 'ICN', airlines: ['Japan Airlines', 'Korean Air'], priceFrom: 170, priceTo: 340, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'NRT', to: 'PVG', airlines: ['ANA', 'China Eastern'], priceFrom: 190, priceTo: 380, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'NRT', to: 'PEK', airlines: ['ANA', 'Air China'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'NRT', to: 'HKG', airlines: ['Cathay Pacific', 'Japan Airlines'], priceFrom: 240, priceTo: 480, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'NRT', to: 'TPE', airlines: ['Japan Airlines', 'China Airlines'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'NRT', to: 'SIN', airlines: ['Singapore Airlines', 'Japan Airlines'], priceFrom: 280, priceTo: 560, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'NRT', to: 'DPS', airlines: ['Japan Airlines', 'Garuda Indonesia'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '7h 00m', frequency: 'Weekly' },
    { from: 'NRT', to: 'LHR', airlines: ['Japan Airlines', 'British Airways'], priceFrom: 500, priceTo: 1000, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'NRT', to: 'CDG', airlines: ['Japan Airlines', 'Air France'], priceFrom: 480, priceTo: 960, currency: 'USD', duration: '12h 30m', frequency: 'Daily' },
    { from: 'KIX', to: 'ICN', airlines: ['Korean Air', 'Japan Airlines'], priceFrom: 160, priceTo: 320, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'KIX', to: 'PVG', airlines: ['China Eastern', 'ANA'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'KIX', to: 'HKG', airlines: ['Cathay Pacific', 'Japan Airlines'], priceFrom: 220, priceTo: 440, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'PVG', airlines: ['Korean Air', 'China Eastern'], priceFrom: 140, priceTo: 280, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'PEK', airlines: ['Korean Air', 'Air China'], priceFrom: 140, priceTo: 280, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'CAN', airlines: ['Korean Air', 'China Southern'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'HKG', airlines: ['Korean Air', 'Cathay Pacific'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'ICN', to: 'TPE', airlines: ['Korean Air', 'China Airlines'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'ICN', to: 'SIN', airlines: ['Korean Air', 'Singapore Airlines'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'BKK', airlines: ['Korean Air', 'Thai Airways'], priceFrom: 240, priceTo: 480, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'MNL', airlines: ['Korean Air', 'Philippine Airlines'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'ICN', to: 'SGN', airlines: ['Korean Air', 'Vietnam Airlines'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'ICN', to: 'SYD', airlines: ['Korean Air', 'Qantas'], priceFrom: 380, priceTo: 700, currency: 'USD', duration: '10h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'LAX', airlines: ['Korean Air', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'ICN', to: 'SFO', airlines: ['Korean Air', 'United'], priceFrom: 460, priceTo: 870, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'PVG', to: 'PEK', airlines: ['China Eastern', 'Air China'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'PVG', to: 'CAN', airlines: ['China Southern', 'China Eastern'], priceFrom: 70, priceTo: 160, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'PVG', to: 'HKG', airlines: ['China Eastern', 'Cathay Pacific'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'PVG', to: 'TPE', airlines: ['China Eastern', 'China Airlines'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'PVG', to: 'SIN', airlines: ['China Eastern', 'Singapore Airlines'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'PVG', to: 'BKK', airlines: ['China Eastern', 'Thai Airways'], priceFrom: 160, priceTo: 320, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'PVG', to: 'NRT', airlines: ['China Eastern', 'Japan Airlines'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'PVG', to: 'ICN', airlines: ['China Eastern', 'Korean Air'], priceFrom: 140, priceTo: 280, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'PVG', to: 'LAX', airlines: ['China Eastern', 'United'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'PVG', to: 'SFO', airlines: ['China Eastern', 'United'], priceFrom: 420, priceTo: 780, currency: 'USD', duration: '11h 30m', frequency: 'Daily' },
    { from: 'PVG', to: 'SYD', airlines: ['China Eastern', 'Qantas'], priceFrom: 350, priceTo: 650, currency: 'USD', duration: '11h 00m', frequency: 'Weekly' },
    { from: 'PEK', to: 'HKG', airlines: ['Air China', 'Cathay Pacific'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'PEK', to: 'SIN', airlines: ['Air China', 'Singapore Airlines'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'PEK', to: 'ICN', airlines: ['Air China', 'Korean Air'], priceFrom: 140, priceTo: 280, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'PEK', to: 'NRT', airlines: ['Air China', 'Japan Airlines'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'HKG', to: 'TPE', airlines: ['Cathay Pacific', 'China Airlines'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'HKG', to: 'SIN', airlines: ['Cathay Pacific', 'Singapore Airlines'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '3h 45m', frequency: 'Daily' },
    { from: 'HKG', to: 'BKK', airlines: ['Cathay Pacific', 'Thai Airways'], priceFrom: 110, priceTo: 240, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'HKG', to: 'SGN', airlines: ['Cathay Pacific', 'Vietnam Airlines'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'HKG', to: 'MNL', airlines: ['Cathay Pacific', 'Philippine Airlines'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'HKG', to: 'DPS', airlines: ['Cathay Pacific', 'Hong Kong Airlines'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'HKG', to: 'DIL', airlines: ['Cathay Pacific'], priceFrom: 350, priceTo: 650, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    { from: 'HKG', to: 'LHR', airlines: ['Cathay Pacific', 'British Airways'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '12h 30m', frequency: 'Daily' },
    { from: 'HKG', to: 'LAX', airlines: ['Cathay Pacific', 'United'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'HKG', to: 'SFO', airlines: ['Cathay Pacific', 'United'], priceFrom: 420, priceTo: 780, currency: 'USD', duration: '12h 30m', frequency: 'Daily' },
    { from: 'HKG', to: 'SYD', airlines: ['Cathay Pacific', 'Qantas'], priceFrom: 350, priceTo: 680, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'TPE', to: 'SIN', airlines: ['China Airlines', 'Singapore Airlines'], priceFrom: 140, priceTo: 280, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'TPE', to: 'NRT', airlines: ['China Airlines', 'Japan Airlines'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'TPE', to: 'ICN', airlines: ['China Airlines', 'Korean Air'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    // ══════════════════════════════════════
    // SOUTH ASIA
    // ══════════════════════════════════════
    { from: 'DEL', to: 'BOM', airlines: ['Air India', 'IndiGo', 'Vistara'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'DEL', to: 'MAA', airlines: ['Air India', 'IndiGo'], priceFrom: 50, priceTo: 110, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'BLR', airlines: ['Air India', 'IndiGo'], priceFrom: 45, priceTo: 105, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'CCU', airlines: ['Air India', 'IndiGo'], priceFrom: 50, priceTo: 110, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'DEL', to: 'KTM', airlines: ['Air India', 'Buddha Air'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'CMB', airlines: ['Air India', 'SriLankan Airlines'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'DAC', airlines: ['Air India', 'Biman Bangladesh'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'KHI', airlines: ['Air India', 'Pakistan International'], priceFrom: 110, priceTo: 250, currency: 'USD', duration: '2h 00m', frequency: 'Weekly' },
    { from: 'DEL', to: 'SIN', airlines: ['Singapore Airlines', 'Air India'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'BKK', airlines: ['Thai Airways', 'Air India'], priceFrom: 160, priceTo: 350, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'DEL', to: 'HKG', airlines: ['Cathay Pacific', 'Air India'], priceFrom: 220, priceTo: 440, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'DEL', to: 'DXB', airlines: ['Emirates', 'Air India'], priceFrom: 160, priceTo: 350, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'DEL', to: 'DOH', airlines: ['Qatar Airways', 'Air India'], priceFrom: 180, priceTo: 380, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'DEL', to: 'LHR', airlines: ['Air India', 'British Airways'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '9h 00m', frequency: 'Daily' },
    { from: 'DEL', to: 'CDG', airlines: ['Air India', 'Air France'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '8h 30m', frequency: 'Daily' },
    { from: 'BOM', to: 'MAA', airlines: ['Air India', 'IndiGo'], priceFrom: 45, priceTo: 100, currency: 'USD', duration: '1h 40m', frequency: 'Daily' },
    { from: 'BOM', to: 'BLR', airlines: ['Air India', 'IndiGo'], priceFrom: 40, priceTo: 95, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'BOM', to: 'CMB', airlines: ['SriLankan Airlines', 'IndiGo'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'BOM', to: 'DXB', airlines: ['Emirates', 'Air India'], priceFrom: 150, priceTo: 320, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    // ── Middle East & Europe ──
    { from: 'DXB', to: 'DOH', airlines: ['Emirates', 'Qatar Airways'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 10m', frequency: 'Daily' },
    { from: 'DXB', to: 'AUH', airlines: ['Emirates', 'Etihad'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '45m', frequency: 'Daily' },
    { from: 'DXB', to: 'LHR', airlines: ['Emirates', 'British Airways'], priceFrom: 300, priceTo: 700, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'LIS', airlines: ['Emirates', 'TAP Air Portugal'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'IST', airlines: ['Emirates', 'Turkish Airlines'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'CDG', airlines: ['Emirates', 'Air France'], priceFrom: 320, priceTo: 650, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'FRA', airlines: ['Emirates', 'Lufthansa'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'MUC', airlines: ['Emirates'], priceFrom: 310, priceTo: 620, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'AMS', airlines: ['Emirates', 'KLM'], priceFrom: 330, priceTo: 660, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'MAD', airlines: ['Emirates'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'FCO', airlines: ['Emirates'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'MXP', airlines: ['Emirates'], priceFrom: 300, priceTo: 580, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'RUH', airlines: ['Emirates', 'Saudia'], priceFrom: 150, priceTo: 320, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'JED', airlines: ['Emirates', 'Saudia'], priceFrom: 160, priceTo: 340, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'KWI', airlines: ['Emirates'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'MCT', airlines: ['Emirates', 'Oman Air'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'BAH', airlines: ['Emirates', 'Gulf Air'], priceFrom: 90, priceTo: 190, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'DXB', to: 'AMM', airlines: ['Emirates'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'SYD', airlines: ['Emirates', 'Qantas'], priceFrom: 500, priceTo: 1000, currency: 'USD', duration: '14h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'MEL', airlines: ['Emirates'], priceFrom: 520, priceTo: 1000, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'PER', airlines: ['Emirates'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '10h 00m', frequency: 'Weekly' },
    { from: 'DXB', to: 'NRT', airlines: ['Emirates', 'Japan Airlines'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'ICN', airlines: ['Emirates', 'Korean Air'], priceFrom: 420, priceTo: 800, currency: 'USD', duration: '8h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'DEL', airlines: ['Emirates', 'Air India'], priceFrom: 160, priceTo: 350, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'DXB', to: 'BOM', airlines: ['Emirates', 'Air India'], priceFrom: 150, priceTo: 320, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'SIN', airlines: ['Emirates', 'Singapore Airlines'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'DXB', to: 'DPS', airlines: ['Emirates'], priceFrom: 350, priceTo: 650, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'DOH', to: 'LHR', airlines: ['Qatar Airways', 'British Airways'], priceFrom: 320, priceTo: 650, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'DOH', to: 'CDG', airlines: ['Qatar Airways', 'Air France'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'DOH', to: 'FRA', airlines: ['Qatar Airways', 'Lufthansa'], priceFrom: 310, priceTo: 620, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'DOH', to: 'SIN', airlines: ['Qatar Airways'], priceFrom: 220, priceTo: 450, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'DOH', to: 'SYD', airlines: ['Qatar Airways'], priceFrom: 550, priceTo: 1000, currency: 'USD', duration: '14h 00m', frequency: 'Weekly' },
    { from: 'DOH', to: 'DEL', airlines: ['Qatar Airways', 'Air India'], priceFrom: 180, priceTo: 380, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'DOH', to: 'BKK', airlines: ['Qatar Airways', 'Thai Airways'], priceFrom: 200, priceTo: 420, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'IST', to: 'LHR', airlines: ['Turkish Airlines', 'British Airways'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'IST', to: 'CDG', airlines: ['Turkish Airlines', 'Air France'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'IST', to: 'FRA', airlines: ['Turkish Airlines', 'Lufthansa'], priceFrom: 170, priceTo: 380, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'IST', to: 'AMS', airlines: ['Turkish Airlines', 'KLM'], priceFrom: 190, priceTo: 400, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'IST', to: 'DXB', airlines: ['Turkish Airlines', 'Emirates'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'IST', to: 'DEL', airlines: ['Turkish Airlines', 'Air India'], priceFrom: 220, priceTo: 480, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'IST', to: 'BKK', airlines: ['Turkish Airlines', 'Thai Airways'], priceFrom: 250, priceTo: 520, currency: 'USD', duration: '8h 00m', frequency: 'Weekly' },
    { from: 'IST', to: 'ICN', airlines: ['Turkish Airlines', 'Korean Air'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '9h 00m', frequency: 'Weekly' },
    { from: 'IST', to: 'NRT', airlines: ['Turkish Airlines', 'Japan Airlines'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '10h 00m', frequency: 'Weekly' },
    // ── Europe inter-city ──
    { from: 'LIS', to: 'OPO', airlines: ['TAP Air Portugal', 'Ryanair'], priceFrom: 20, priceTo: 60, currency: 'USD', duration: '50m', frequency: 'Daily' },
    { from: 'LIS', to: 'FAO', airlines: ['TAP Air Portugal', 'Ryanair'], priceFrom: 15, priceTo: 45, currency: 'USD', duration: '45m', frequency: 'Daily' },
    { from: 'LIS', to: 'MAD', airlines: ['TAP Air Portugal', 'Iberia', 'Ryanair'], priceFrom: 25, priceTo: 70, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'LIS', to: 'BCN', airlines: ['TAP Air Portugal', 'Vueling'], priceFrom: 30, priceTo: 80, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'LIS', to: 'LHR', airlines: ['TAP Air Portugal', 'British Airways'], priceFrom: 80, priceTo: 200, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'LIS', to: 'LGW', airlines: ['TAP Air Portugal', 'easyJet'], priceFrom: 70, priceTo: 180, currency: 'USD', duration: '2h 40m', frequency: 'Daily' },
    { from: 'LIS', to: 'CDG', airlines: ['TAP Air Portugal', 'Air France'], priceFrom: 70, priceTo: 180, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'LIS', to: 'AMS', airlines: ['TAP Air Portugal', 'KLM'], priceFrom: 80, priceTo: 190, currency: 'USD', duration: '2h 50m', frequency: 'Daily' },
    { from: 'LIS', to: 'FRA', airlines: ['TAP Air Portugal', 'Lufthansa'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'LIS', to: 'MUC', airlines: ['TAP Air Portugal', 'Lufthansa'], priceFrom: 90, priceTo: 210, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'LIS', to: 'FCO', airlines: ['TAP Air Portugal', 'ITA Airways'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'LIS', to: 'MXP', airlines: ['TAP Air Portugal', 'easyJet'], priceFrom: 50, priceTo: 130, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'LIS', to: 'ZRH', airlines: ['TAP Air Portugal', 'Swiss'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'LIS', to: 'BRU', airlines: ['TAP Air Portugal', 'Brussels Airlines'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'LIS', to: 'CPH', airlines: ['TAP Air Portugal', 'SAS'], priceFrom: 100, priceTo: 230, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'LIS', to: 'DUB', airlines: ['TAP Air Portugal', 'Ryanair'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'LIS', to: 'VIE', airlines: ['TAP Air Portugal', 'Austrian'], priceFrom: 110, priceTo: 240, currency: 'USD', duration: '3h 15m', frequency: 'Weekly' },
    { from: 'LIS', to: 'WAW', airlines: ['TAP Air Portugal', 'LOT'], priceFrom: 100, priceTo: 230, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'LIS', to: 'PRG', airlines: ['TAP Air Portugal', 'Czech Airlines'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'LIS', to: 'BUD', airlines: ['TAP Air Portugal', 'Ryanair'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'LIS', to: 'ATH', airlines: ['TAP Air Portugal', 'Aegean'], priceFrom: 100, priceTo: 240, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'LIS', to: 'HEL', airlines: ['TAP Air Portugal', 'Finnair'], priceFrom: 130, priceTo: 280, currency: 'USD', duration: '4h 00m', frequency: 'Weekly' },
    { from: 'LIS', to: 'ARN', airlines: ['TAP Air Portugal', 'SAS'], priceFrom: 120, priceTo: 260, currency: 'USD', duration: '3h 45m', frequency: 'Weekly' },
    { from: 'LIS', to: 'OSL', airlines: ['TAP Air Portugal', 'Norwegian'], priceFrom: 110, priceTo: 250, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'LIS', to: 'DEL', airlines: ['TAP Air Portugal', 'Air India'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '9h 00m', frequency: 'Weekly' },
    { from: 'LIS', to: 'BOM', airlines: ['TAP Air Portugal'], priceFrom: 320, priceTo: 640, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'LIS', to: 'JNB', airlines: ['TAP Air Portugal', 'South African Airways'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '9h 00m', frequency: 'Weekly' },
    { from: 'LIS', to: 'ADD', airlines: ['TAP Air Portugal', 'Ethiopian Airlines'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '7h 30m', frequency: 'Weekly' },
    { from: 'LIS', to: 'LAX', airlines: ['TAP Air Portugal', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Weekly' },
    { from: 'LIS', to: 'GRU', airlines: ['TAP Air Portugal'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'OPO', to: 'LHR', airlines: ['TAP Air Portugal', 'Ryanair'], priceFrom: 30, priceTo: 80, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'OPO', to: 'CDG', airlines: ['TAP Air Portugal', 'Air France'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'OPO', to: 'MAD', airlines: ['TAP Air Portugal', 'Iberia'], priceFrom: 25, priceTo: 60, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'CDG', airlines: ['British Airways', 'Air France', 'Eurostar'], priceFrom: 70, priceTo: 180, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'LHR', to: 'AMS', airlines: ['British Airways', 'KLM'], priceFrom: 80, priceTo: 190, currency: 'USD', duration: '1h 10m', frequency: 'Daily' },
    { from: 'LHR', to: 'FRA', airlines: ['British Airways', 'Lufthansa'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '1h 40m', frequency: 'Daily' },
    { from: 'LHR', to: 'MUC', airlines: ['British Airways', 'Lufthansa'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '1h 50m', frequency: 'Daily' },
    { from: 'LHR', to: 'MAD', airlines: ['British Airways', 'Iberia'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'LHR', to: 'BCN', airlines: ['British Airways', 'Vueling'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'FCO', airlines: ['British Airways', 'ITA Airways'], priceFrom: 80, priceTo: 190, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'LHR', to: 'MXP', airlines: ['British Airways', 'easyJet'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'ZRH', airlines: ['British Airways', 'Swiss'], priceFrom: 80, priceTo: 190, currency: 'USD', duration: '1h 40m', frequency: 'Daily' },
    { from: 'LHR', to: 'VIE', airlines: ['British Airways', 'Austrian'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'LHR', to: 'BRU', airlines: ['British Airways', 'Brussels Airlines'], priceFrom: 60, priceTo: 140, currency: 'USD', duration: '1h 05m', frequency: 'Daily' },
    { from: 'LHR', to: 'CPH', airlines: ['British Airways', 'SAS'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 55m', frequency: 'Daily' },
    { from: 'LHR', to: 'DUB', airlines: ['British Airways', 'Aer Lingus'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'LHR', to: 'WAW', airlines: ['British Airways', 'LOT'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'LHR', to: 'PRG', airlines: ['British Airways', 'Czech Airlines'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'BUD', airlines: ['British Airways', 'Wizz Air'], priceFrom: 70, priceTo: 160, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'LHR', to: 'ATH', airlines: ['British Airways', 'Aegean'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '3h 15m', frequency: 'Daily' },
    { from: 'LHR', to: 'HEL', airlines: ['British Airways', 'Finnair'], priceFrom: 120, priceTo: 250, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'LHR', to: 'ARN', airlines: ['British Airways', 'SAS'], priceFrom: 90, priceTo: 200, currency: 'USD', duration: '2h 20m', frequency: 'Daily' },
    { from: 'LHR', to: 'OSL', airlines: ['British Airways', 'Norwegian'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'JFK', airlines: ['British Airways', 'Virgin Atlantic', 'American'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'LHR', to: 'LAX', airlines: ['British Airways', 'Virgin Atlantic'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'SFO', airlines: ['British Airways', 'United'], priceFrom: 420, priceTo: 820, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'YYZ', airlines: ['British Airways', 'Air Canada'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'LHR', to: 'YVR', airlines: ['British Airways', 'Air Canada'], priceFrom: 350, priceTo: 680, currency: 'USD', duration: '9h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'GRU', airlines: ['British Airways', 'LATAM'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '11h 30m', frequency: 'Weekly' },
    { from: 'LHR', to: 'JNB', airlines: ['British Airways', 'South African Airways'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'LHR', to: 'LOS', airlines: ['British Airways', 'Virgin Atlantic'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'LHR', to: 'CAI', airlines: ['British Airways', 'EgyptAir'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'LHR', to: 'CMN', airlines: ['British Airways', 'Royal Air Maroc'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'CDG', to: 'AMS', airlines: ['Air France', 'KLM'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '1h 10m', frequency: 'Daily' },
    { from: 'CDG', to: 'FRA', airlines: ['Air France', 'Lufthansa'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '1h 20m', frequency: 'Daily' },
    { from: 'CDG', to: 'MAD', airlines: ['Air France', 'Iberia'], priceFrom: 60, priceTo: 140, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'CDG', to: 'BCN', airlines: ['Air France', 'Vueling'], priceFrom: 50, priceTo: 130, currency: 'USD', duration: '1h 35m', frequency: 'Daily' },
    { from: 'CDG', to: 'FCO', airlines: ['Air France', 'ITA Airways'], priceFrom: 70, priceTo: 160, currency: 'USD', duration: '1h 55m', frequency: 'Daily' },
    { from: 'CDG', to: 'ZRH', airlines: ['Air France', 'Swiss'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'CDG', to: 'JFK', airlines: ['Air France', 'Delta'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'CDG', to: 'LAX', airlines: ['Air France', 'Delta'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'CDG', to: 'YUL', airlines: ['Air France', 'Air Canada'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'AMS', to: 'FRA', airlines: ['KLM', 'Lufthansa'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '1h 10m', frequency: 'Daily' },
    { from: 'AMS', to: 'MAD', airlines: ['KLM', 'Iberia'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'AMS', to: 'BCN', airlines: ['KLM', 'Vueling'], priceFrom: 60, priceTo: 140, currency: 'USD', duration: '1h 55m', frequency: 'Daily' },
    { from: 'AMS', to: 'JFK', airlines: ['KLM', 'Delta'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '7h 45m', frequency: 'Daily' },
    { from: 'FRA', to: 'MAD', airlines: ['Lufthansa', 'Iberia'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 15m', frequency: 'Daily' },
    { from: 'FRA', to: 'BCN', airlines: ['Lufthansa', 'Vueling'], priceFrom: 70, priceTo: 170, currency: 'USD', duration: '1h 50m', frequency: 'Daily' },
    { from: 'FRA', to: 'JFK', airlines: ['Lufthansa', 'United'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'FRA', to: 'SFO', airlines: ['Lufthansa', 'United'], priceFrom: 400, priceTo: 780, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'MAD', to: 'BCN', airlines: ['Iberia', 'Vueling', 'Ryanair'], priceFrom: 20, priceTo: 60, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'MAD', to: 'FCO', airlines: ['Iberia', 'ITA Airways'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'MAD', to: 'GRU', airlines: ['Iberia', 'LATAM'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '10h 00m', frequency: 'Weekly' },
    { from: 'MAD', to: 'MEX', airlines: ['Iberia', 'Aeromexico'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '10h 30m', frequency: 'Weekly' },
    { from: 'MAD', to: 'BOG', airlines: ['Iberia', 'Avianca'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'MAD', to: 'SCL', airlines: ['Iberia', 'LATAM'], priceFrom: 420, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Weekly' },
    // ── Africa ──
    { from: 'JNB', to: 'CPT', airlines: ['South African Airways', 'FlySafair'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'JNB', to: 'DUR', airlines: ['South African Airways', 'FlySafair'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'JNB', to: 'NBO', airlines: ['South African Airways', 'Kenya Airways'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 45m', frequency: 'Weekly' },
    { from: 'JNB', to: 'LUN', airlines: ['South African Airways', 'Zambia Airways'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'JNB', to: 'DAR', airlines: ['South African Airways', 'Air Tanzania'], priceFrom: 220, priceTo: 440, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'JNB', to: 'LOS', airlines: ['South African Airways', 'Arik Air'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'JNB', to: 'CAI', airlines: ['EgyptAir', 'South African Airways'], priceFrom: 280, priceTo: 560, currency: 'USD', duration: '6h 30m', frequency: 'Weekly' },
    { from: 'JNB', to: 'ADD', airlines: ['Ethiopian Airlines', 'South African Airways'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'JNB', to: 'DXB', airlines: ['Emirates', 'Qatar Airways'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'JNB', to: 'DOH', airlines: ['Qatar Airways'], priceFrom: 360, priceTo: 720, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'JNB', to: 'LHR', airlines: ['British Airways', 'Virgin Atlantic'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'JNB', to: 'CDG', airlines: ['Air France', 'South African Airways'], priceFrom: 420, priceTo: 820, currency: 'USD', duration: '10h 30m', frequency: 'Weekly' },
    { from: 'CPT', to: 'DUR', airlines: ['South African Airways', 'FlySafair'], priceFrom: 35, priceTo: 90, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'CPT', to: 'LHR', airlines: ['British Airways', 'Virgin Atlantic'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '11h 30m', frequency: 'Weekly' },
    { from: 'ADD', to: 'NBO', airlines: ['Ethiopian Airlines', 'Kenya Airways'], priceFrom: 150, priceTo: 300, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'ADD', to: 'DAR', airlines: ['Ethiopian Airlines', 'Air Tanzania'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'ADD', to: 'LOS', airlines: ['Ethiopian Airlines'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'ADD', to: 'ACC', airlines: ['Ethiopian Airlines'], priceFrom: 320, priceTo: 640, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'ADD', to: 'DXB', airlines: ['Ethiopian Airlines', 'Emirates'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'ADD', to: 'LHR', airlines: ['Ethiopian Airlines'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '7h 30m', frequency: 'Weekly' },
    { from: 'ADD', to: 'CDG', airlines: ['Ethiopian Airlines', 'Air France'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '6h 30m', frequency: 'Weekly' },
    { from: 'ADD', to: 'CAI', airlines: ['Ethiopian Airlines', 'EgyptAir'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'NBO', to: 'MBA', airlines: ['Kenya Airways', 'JamboJet'], priceFrom: 40, priceTo: 90, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'NBO', to: 'DAR', airlines: ['Kenya Airways', 'Air Tanzania'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'NBO', to: 'DXB', airlines: ['Emirates', 'Kenya Airways'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'NBO', to: 'LHR', airlines: ['Kenya Airways', 'British Airways'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '8h 30m', frequency: 'Daily' },
    { from: 'NBO', to: 'CDG', airlines: ['Kenya Airways', 'Air France'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '8h 30m', frequency: 'Weekly' },
    { from: 'CAI', to: 'DXB', airlines: ['EgyptAir', 'Emirates'], priceFrom: 180, priceTo: 380, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'CAI', to: 'LHR', airlines: ['EgyptAir', 'British Airways'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'CAI', to: 'CDG', airlines: ['EgyptAir', 'Air France'], priceFrom: 220, priceTo: 460, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'CAI', to: 'ADD', airlines: ['EgyptAir', 'Ethiopian Airlines'], priceFrom: 180, priceTo: 360, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'LOS', to: 'ACC', airlines: ['Arik Air', 'Africa World Airlines'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'LOS', to: 'LHR', airlines: ['British Airways', 'Virgin Atlantic'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'LOS', to: 'CDG', airlines: ['Air France'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'LOS', to: 'DXB', airlines: ['Emirates'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '8h 00m', frequency: 'Weekly' },
    { from: 'CMN', to: 'LIS', airlines: ['Royal Air Maroc', 'TAP Air Portugal'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'CMN', to: 'MAD', airlines: ['Royal Air Maroc', 'Iberia'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '1h 45m', frequency: 'Daily' },
    { from: 'CMN', to: 'CDG', airlines: ['Royal Air Maroc', 'Air France'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'CMN', to: 'DXB', airlines: ['Royal Air Maroc', 'Emirates'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Weekly' },
    // ── Americas ──
    { from: 'LAX', to: 'SFO', airlines: ['United', 'Delta', 'Southwest'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'LAX', to: 'SEA', airlines: ['United', 'Delta', 'Alaska'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'LAX', to: 'DEN', airlines: ['United', 'Delta', 'Southwest'], priceFrom: 50, priceTo: 130, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'ORD', airlines: ['United', 'American', 'Delta'], priceFrom: 80, priceTo: 200, currency: 'USD', duration: '3h 45m', frequency: 'Daily' },
    { from: 'LAX', to: 'JFK', airlines: ['United', 'Delta', 'American'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'MIA', airlines: ['American', 'Delta'], priceFrom: 100, priceTo: 240, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'ATL', airlines: ['Delta', 'Southwest'], priceFrom: 90, priceTo: 220, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'HND', airlines: ['Japan Airlines', 'ANA', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'ICN', airlines: ['Korean Air', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'SYD', airlines: ['United', 'Qantas'], priceFrom: 500, priceTo: 900, currency: 'USD', duration: '15h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'AKL', airlines: ['Air New Zealand', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'LHR', airlines: ['British Airways', 'Virgin Atlantic'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '10h 00m', frequency: 'Daily' },
    { from: 'LAX', to: 'CDG', airlines: ['Air France', 'Delta'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '10h 30m', frequency: 'Daily' },
    { from: 'LAX', to: 'LIS', airlines: ['TAP Air Portugal', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Weekly' },
    { from: 'LAX', to: 'DXB', airlines: ['Emirates'], priceFrom: 500, priceTo: 1000, currency: 'USD', duration: '16h 00m', frequency: 'Weekly' },
    { from: 'LAX', to: 'YVR', airlines: ['Air Canada', 'United'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'LAX', to: 'MEX', airlines: ['Aeromexico', 'United'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'LAX', to: 'GRU', airlines: ['LATAM', 'United'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '12h 00m', frequency: 'Weekly' },
    { from: 'JFK', to: 'ORD', airlines: ['American', 'Delta', 'United'], priceFrom: 70, priceTo: 180, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'JFK', to: 'ATL', airlines: ['Delta', 'JetBlue'], priceFrom: 80, priceTo: 190, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'JFK', to: 'MIA', airlines: ['American', 'Delta', 'JetBlue'], priceFrom: 70, priceTo: 180, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'SFO', airlines: ['United', 'Delta', 'JetBlue'], priceFrom: 100, priceTo: 240, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'SEA', airlines: ['Delta', 'Alaska'], priceFrom: 100, priceTo: 240, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'LHR', airlines: ['British Airways', 'Virgin Atlantic', 'Delta'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'CDG', airlines: ['Air France', 'Delta'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'AMS', airlines: ['KLM', 'Delta'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'FRA', airlines: ['Lufthansa', 'United'], priceFrom: 320, priceTo: 650, currency: 'USD', duration: '7h 30m', frequency: 'Daily' },
    { from: 'JFK', to: 'MAD', airlines: ['Iberia', 'American'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '6h 30m', frequency: 'Daily' },
    { from: 'JFK', to: 'LIS', airlines: ['TAP Air Portugal', 'American'], priceFrom: 280, priceTo: 550, currency: 'USD', duration: '6h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'FCO', airlines: ['ITA Airways', 'Delta'], priceFrom: 320, priceTo: 650, currency: 'USD', duration: '7h 45m', frequency: 'Daily' },
    { from: 'JFK', to: 'DXB', airlines: ['Emirates'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'DOH', airlines: ['Qatar Airways'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '11h 00m', frequency: 'Weekly' },
    { from: 'JFK', to: 'DEL', airlines: ['Air India', 'United'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'NRT', airlines: ['Japan Airlines', 'ANA', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '13h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'ICN', airlines: ['Korean Air', 'United'], priceFrom: 450, priceTo: 850, currency: 'USD', duration: '14h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'HKG', airlines: ['Cathay Pacific'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '16h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'GRU', airlines: ['LATAM', 'American'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'JFK', to: 'EZE', airlines: ['Aerolineas Argentinas', 'American'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '10h 30m', frequency: 'Weekly' },
    { from: 'JFK', to: 'BOG', airlines: ['Avianca', 'American'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '5h 30m', frequency: 'Daily' },
    { from: 'JFK', to: 'MEX', airlines: ['Aeromexico', 'American'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'JFK', to: 'LIM', airlines: ['LATAM', 'American'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 30m', frequency: 'Weekly' },
    { from: 'JFK', to: 'PTY', airlines: ['Copa', 'American'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'JFK', to: 'SJO', airlines: ['JetBlue', 'American'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    { from: 'JFK', to: 'HAV', airlines: ['American', 'JetBlue'], priceFrom: 150, priceTo: 350, currency: 'USD', duration: '3h 30m', frequency: 'Weekly' },
    { from: 'SFO', to: 'SEA', airlines: ['United', 'Delta', 'Alaska'], priceFrom: 50, priceTo: 120, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'SFO', to: 'DEN', airlines: ['United', 'Southwest'], priceFrom: 50, priceTo: 130, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'SFO', to: 'ORD', airlines: ['United', 'American'], priceFrom: 90, priceTo: 220, currency: 'USD', duration: '3h 45m', frequency: 'Daily' },
    { from: 'SFO', to: 'HND', airlines: ['United', 'Japan Airlines'], priceFrom: 460, priceTo: 870, currency: 'USD', duration: '11h 00m', frequency: 'Daily' },
    { from: 'SFO', to: 'ICN', airlines: ['Korean Air', 'United'], priceFrom: 460, priceTo: 870, currency: 'USD', duration: '12h 00m', frequency: 'Daily' },
    { from: 'SFO', to: 'SYD', airlines: ['United', 'Qantas'], priceFrom: 520, priceTo: 950, currency: 'USD', duration: '15h 00m', frequency: 'Daily' },
    { from: 'SFO', to: 'AKL', airlines: ['Air New Zealand', 'United'], priceFrom: 470, priceTo: 880, currency: 'USD', duration: '12h 30m', frequency: 'Daily' },
    { from: 'SFO', to: 'LHR', airlines: ['British Airways', 'United'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '10h 00m', frequency: 'Daily' },
    { from: 'SFO', to: 'YVR', airlines: ['Air Canada', 'United'], priceFrom: 80, priceTo: 200, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'YYZ', to: 'YUL', airlines: ['Air Canada', 'WestJet'], priceFrom: 60, priceTo: 150, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'YYZ', to: 'YVR', airlines: ['Air Canada', 'WestJet'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'YYZ', to: 'JFK', airlines: ['Air Canada', 'Delta'], priceFrom: 80, priceTo: 190, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'YYZ', to: 'LHR', airlines: ['Air Canada', 'British Airways'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'YYZ', to: 'CDG', airlines: ['Air Canada', 'Air France'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '7h 00m', frequency: 'Daily' },
    { from: 'YYZ', to: 'LAX', airlines: ['Air Canada', 'United'], priceFrom: 150, priceTo: 350, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'YVR', to: 'LAX', airlines: ['Air Canada', 'United'], priceFrom: 100, priceTo: 220, currency: 'USD', duration: '2h 45m', frequency: 'Daily' },
    { from: 'YVR', to: 'SFO', airlines: ['Air Canada', 'United'], priceFrom: 80, priceTo: 200, currency: 'USD', duration: '2h 30m', frequency: 'Daily' },
    { from: 'YVR', to: 'NRT', airlines: ['Air Canada', 'Japan Airlines'], priceFrom: 400, priceTo: 750, currency: 'USD', duration: '9h 00m', frequency: 'Weekly' },
    { from: 'YVR', to: 'SYD', airlines: ['Air Canada', 'Qantas'], priceFrom: 480, priceTo: 900, currency: 'USD', duration: '15h 00m', frequency: 'Weekly' },
    { from: 'GRU', to: 'GIG', airlines: ['LATAM', 'Gol', 'Azul'], priceFrom: 30, priceTo: 80, currency: 'USD', duration: '55m', frequency: 'Daily' },
    { from: 'GRU', to: 'BSB', airlines: ['LATAM', 'Gol'], priceFrom: 40, priceTo: 100, currency: 'USD', duration: '1h 30m', frequency: 'Daily' },
    { from: 'GRU', to: 'MIA', airlines: ['LATAM', 'American'], priceFrom: 300, priceTo: 600, currency: 'USD', duration: '8h 00m', frequency: 'Daily' },
    { from: 'GRU', to: 'JFK', airlines: ['LATAM', 'American'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '9h 30m', frequency: 'Daily' },
    { from: 'GRU', to: 'MAD', airlines: ['LATAM', 'Iberia'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '10h 00m', frequency: 'Weekly' },
    { from: 'GRU', to: 'LIS', airlines: ['TAP Air Portugal', 'LATAM'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'GRU', to: 'LHR', airlines: ['British Airways', 'LATAM'], priceFrom: 450, priceTo: 900, currency: 'USD', duration: '11h 30m', frequency: 'Weekly' },
    { from: 'GRU', to: 'SCL', airlines: ['LATAM'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '4h 00m', frequency: 'Daily' },
    { from: 'GRU', to: 'EZE', airlines: ['LATAM', 'Aerolineas Argentinas'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'GRU', to: 'LIM', airlines: ['LATAM'], priceFrom: 220, priceTo: 450, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'GRU', to: 'BOG', airlines: ['Avianca', 'LATAM'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    { from: 'MEX', to: 'BOG', airlines: ['Aeromexico', 'Avianca'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'MEX', to: 'LIM', airlines: ['Aeromexico', 'LATAM'], priceFrom: 220, priceTo: 480, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'MEX', to: 'SCL', airlines: ['Aeromexico', 'LATAM'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '8h 00m', frequency: 'Weekly' },
    { from: 'MEX', to: 'MAD', airlines: ['Aeromexico', 'Iberia'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '10h 30m', frequency: 'Weekly' },
    { from: 'MEX', to: 'LHR', airlines: ['British Airways', 'Aeromexico'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '10h 00m', frequency: 'Weekly' },
    { from: 'MEX', to: 'CDG', airlines: ['Air France', 'Aeromexico'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '10h 30m', frequency: 'Weekly' },
    { from: 'MEX', to: 'LAX', airlines: ['Aeromexico', 'United'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'MEX', to: 'JFK', airlines: ['Aeromexico', 'American'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '5h 00m', frequency: 'Daily' },
    { from: 'MEX', to: 'HAV', airlines: ['Aeromexico', 'Cubana'], priceFrom: 150, priceTo: 350, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
    { from: 'MEX', to: 'PTY', airlines: ['Copa', 'Aeromexico'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '3h 45m', frequency: 'Weekly' },
    { from: 'MEX', to: 'SJO', airlines: ['Aeromexico', 'Volaris'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '3h 00m', frequency: 'Weekly' },
    { from: 'BOG', to: 'LIM', airlines: ['Avianca', 'LATAM'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'BOG', to: 'SCL', airlines: ['Avianca', 'LATAM'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    { from: 'BOG', to: 'PTY', airlines: ['Copa', 'Avianca'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '1h 15m', frequency: 'Daily' },
    { from: 'BOG', to: 'MIA', airlines: ['Avianca', 'American'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '3h 45m', frequency: 'Daily' },
    { from: 'BOG', to: 'MAD', airlines: ['Avianca', 'Iberia'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'BOG', to: 'MEX', airlines: ['Avianca', 'Aeromexico'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '4h 30m', frequency: 'Daily' },
    { from: 'SCL', to: 'EZE', airlines: ['LATAM', 'Aerolineas Argentinas'], priceFrom: 80, priceTo: 180, currency: 'USD', duration: '2h 00m', frequency: 'Daily' },
    { from: 'SCL', to: 'LIM', airlines: ['LATAM'], priceFrom: 120, priceTo: 260, currency: 'USD', duration: '3h 30m', frequency: 'Daily' },
    { from: 'SCL', to: 'MAD', airlines: ['Iberia', 'LATAM'], priceFrom: 420, priceTo: 850, currency: 'USD', duration: '12h 00m', frequency: 'Weekly' },
    { from: 'EZE', to: 'LIM', airlines: ['Aerolineas Argentinas', 'LATAM'], priceFrom: 200, priceTo: 400, currency: 'USD', duration: '4h 30m', frequency: 'Weekly' },
    { from: 'EZE', to: 'MAD', airlines: ['Iberia', 'Aerolineas Argentinas'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '12h 00m', frequency: 'Weekly' },
    { from: 'EZE', to: 'MIA', airlines: ['American', 'Aerolineas Argentinas'], priceFrom: 380, priceTo: 750, currency: 'USD', duration: '9h 00m', frequency: 'Weekly' },
    { from: 'LIM', to: 'MIA', airlines: ['LATAM', 'American'], priceFrom: 250, priceTo: 500, currency: 'USD', duration: '5h 00m', frequency: 'Weekly' },
    { from: 'LIM', to: 'MAD', airlines: ['LATAM', 'Iberia'], priceFrom: 400, priceTo: 800, currency: 'USD', duration: '11h 00m', frequency: 'Weekly' },
    { from: 'PTY', to: 'MIA', airlines: ['Copa', 'American'], priceFrom: 100, priceTo: 250, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'PTY', to: 'LAX', airlines: ['Copa'], priceFrom: 200, priceTo: 450, currency: 'USD', duration: '6h 30m', frequency: 'Weekly' },
    { from: 'PTY', to: 'MAD', airlines: ['Copa', 'Iberia'], priceFrom: 350, priceTo: 700, currency: 'USD', duration: '9h 30m', frequency: 'Weekly' },
    { from: 'SJO', to: 'MIA', airlines: ['American', 'JetBlue'], priceFrom: 120, priceTo: 280, currency: 'USD', duration: '3h 00m', frequency: 'Daily' },
    { from: 'SJO', to: 'LAX', airlines: ['United', 'Delta'], priceFrom: 180, priceTo: 400, currency: 'USD', duration: '5h 30m', frequency: 'Weekly' },
    { from: 'HAV', to: 'MIA', airlines: ['American', 'JetBlue'], priceFrom: 100, priceTo: 250, currency: 'USD', duration: '1h 00m', frequency: 'Daily' },
    { from: 'HAV', to: 'MEX', airlines: ['Aeromexico', 'Cubana'], priceFrom: 150, priceTo: 350, currency: 'USD', duration: '2h 30m', frequency: 'Weekly' },
  ];

  // Compute stats
  const uniqueCountries = new Set(airports.map(a => a.country));
  const uniqueRegions = new Set(airports.map(a => a.region));

  res.json({
    airports,
    routes,
    stats: {
      airportCount: airports.length,
      routeCount: routes.length,
      countryCount: uniqueCountries.size,
      regionCount: uniqueRegions.size,
    },
  });
});

// POST /reset-mock-data — Reset mock data (requires settings.edit)
router.post('/reset-mock-data', authenticate, requirePermission('settings.edit'), (req, res) => {
  // Audit: log who reset data
  console.log(`[AUDIT] Mock data reset by ${req.user.email} (${req.user.role})`);
  res.json({ success: true, message: 'Mock data reset complete.' });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export default router;
