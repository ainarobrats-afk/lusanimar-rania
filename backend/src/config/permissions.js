// ═══════════════════════════════════════════════════════════
// RBAC — Permission Definitions & Seed Data
// RANIA / SANIMAR STUDIO
// ═══════════════════════════════════════════════════════════

// ── 1. ALL PERMISSION KEYS ─────────────────────────────────
// Convention: <namespace>.<action>
// Wildcard: namespace.* = all actions in that namespace

const PERMISSIONS = [
  // ── Dashboard ──
  { key: 'dashboard.view',      namespace: 'dashboard', action: 'view',  description: 'View dashboard overview' },

  // ── Users ──
  { key: 'users.view',          namespace: 'users',     action: 'view',  description: 'View user list & profiles' },
  { key: 'users.edit',          namespace: 'users',     action: 'edit',  description: 'Edit user details' },
  { key: 'users.ban',           namespace: 'users',     action: 'ban',   description: 'Ban/unban users' },
  { key: 'users.premium',       namespace: 'users',     action: 'premium', description: 'Manage premium subscriptions' },

  // ── Bookings ──
  { key: 'bookings.view',       namespace: 'bookings',  action: 'view',  description: 'View booking list & details' },
  { key: 'bookings.edit',       namespace: 'bookings',  action: 'edit',  description: 'Modify bookings (status, price)' },
  { key: 'bookings.cancel',     namespace: 'bookings',  action: 'cancel', description: 'Cancel bookings' },
  { key: 'bookings.refund',     namespace: 'bookings',  action: 'refund', description: 'Process refunds' },
  { key: 'bookings.fraud',      namespace: 'bookings',  action: 'fraud',  description: 'Review fraud flags' },
  { key: 'bookings.export',     namespace: 'bookings',  action: 'export', description: 'Export bookings CSV/PDF' },

  // ── Finance / Revenue ──
  { key: 'finance.view',        namespace: 'finance',   action: 'view',  description: 'View revenue dashboard' },
  { key: 'finance.export',      namespace: 'finance',   action: 'export', description: 'Export financial reports' },
  { key: 'finance.edit',        namespace: 'finance',   action: 'edit',  description: 'Edit pricing / markup settings' },
  { key: 'finance.commission',  namespace: 'finance',   action: 'commission', description: 'View commission data' },

  // ── Incidents ──
  { key: 'incidents.view',      namespace: 'incidents', action: 'view',  description: 'View incident log' },
  { key: 'incidents.edit',      namespace: 'incidents', action: 'edit',  description: 'Resolve/update incidents' },

  // ── Staff ──
  { key: 'staff.view',          namespace: 'staff',     action: 'view',  description: 'View staff list & performance' },
  { key: 'staff.edit',          namespace: 'staff',     action: 'edit',  description: 'Add/remove staff, change roles' },

  // ── Market ──
  { key: 'market.view',         namespace: 'market',    action: 'view',  description: 'View marketplace listings' },
  { key: 'market.edit',         namespace: 'market',    action: 'edit',  description: 'Approve/reject/suspend listings' },
  { key: 'market.messages',     namespace: 'market',    action: 'messages', description: 'Monitor market conversations' },

  // ── Content / Explore ──
  { key: 'content.view',        namespace: 'content',   action: 'view',  description: 'View explore posts' },
  { key: 'content.edit',        namespace: 'content',   action: 'edit',  description: 'Publish/hide/delete posts' },

  // ── Hotels ──
  { key: 'hotels.view',         namespace: 'hotels',    action: 'view',  description: 'View hotel partners' },
  { key: 'hotels.edit',         namespace: 'hotels',    action: 'edit',  description: 'Add/edit/suspend hotels' },

  // ── Promos & Deals ──
  { key: 'promos.view',         namespace: 'promos',    action: 'view',  description: 'View promo codes' },
  { key: 'promos.edit',         namespace: 'promos',    action: 'edit',  description: 'Create/disable promos' },
  { key: 'deals.view',          namespace: 'deals',     action: 'view',  description: 'View flash deals' },
  { key: 'deals.edit',          namespace: 'deals',     action: 'edit',  description: 'Create/stop flash deals' },

  // ── QA ──
  { key: 'qa.view',             namespace: 'qa',        action: 'view',  description: 'View QA scores & reports' },
  { key: 'qa.trigger',          namespace: 'qa',        action: 'trigger', description: 'Trigger QA test runs' },

  // ── Audit ──
  { key: 'audit.view',          namespace: 'audit',     action: 'view',  description: 'View audit logs' },
  { key: 'audit.export',        namespace: 'audit',     action: 'export', description: 'Export audit trail' },

  // ── API Keys ──
  { key: 'api_keys.view',       namespace: 'api_keys',  action: 'view',  description: 'View API key status' },
  { key: 'api_keys.edit',       namespace: 'api_keys',  action: 'edit',  description: 'Update/test API keys' },

  // ── Settings ──
  { key: 'settings.view',       namespace: 'settings',  action: 'view',  description: 'View system settings' },
  { key: 'settings.edit',       namespace: 'settings',  action: 'edit',  description: 'Modify system settings' },

  // ── RBAC / Role Management ──
  { key: 'rbac.view',           namespace: 'rbac',      action: 'view',  description: 'View role & permission assignments' },
  { key: 'rbac.edit',           namespace: 'rbac',      action: 'edit',  description: 'Modify roles/permissions/users' },

  // ── Chat / AI ──
  { key: 'chat.view',           namespace: 'chat',      action: 'view',  description: 'View chat logs & AI conversations' },
  { key: 'chat.edit',           namespace: 'chat',      action: 'edit',  description: 'Intervene in AI conversations' },
];

// ── 2. ROLE HIERARCHY ──────────────────────────────────────
// Each role maps to a set of permission keys.
// Supports wildcard: 'finance.*' = all finance permissions.

const ROLES = {
  super_admin: {
    name: 'super_admin',
    description: 'Full system access — all permissions',
    permissions: ['*'],  // wildcard: everything
  },
  admin: {
    name: 'admin',
    description: 'Administrative access — all management tools',
    permissions: [
      'dashboard.*', 'users.*', 'bookings.*',
      'finance.*', 'incidents.*', 'staff.*',
      'market.*', 'content.*', 'hotels.*',
      'promos.*', 'deals.*', 'qa.*',
      'audit.*', 'api_keys.*', 'settings.*',
      'rbac.*', 'chat.*',
    ],
  },
  operations: {
    name: 'operations',
    description: 'Daily operations — bookings, incidents, reports',
    permissions: [
      'dashboard.view', 'bookings.*',
      'incidents.*', 'users.view',
      'finance.view', 'qa.view',
      'chat.view',
    ],
  },
  finance: {
    name: 'finance',
    description: 'Financial access — revenue, commission, exports',
    permissions: [
      'dashboard.view', 'finance.*',
      'bookings.view', 'bookings.export',
      'audit.view', 'users.view',
    ],
  },
  support: {
    name: 'support',
    description: 'Customer support — bookings, users, chat',
    permissions: [
      'dashboard.view', 'bookings.view',
      'users.view', 'chat.*',
      'incidents.view',
    ],
  },
  content_moderator: {
    name: 'content_moderator',
    description: 'Content & marketplace moderation',
    permissions: [
      'market.*', 'content.*',
      'dashboard.view',
    ],
  },
  read_only_auditor: {
    name: 'read_only_auditor',
    description: 'Read-only audit access — compliance',
    permissions: [
      'dashboard.view', 'users.view',
      'bookings.view', 'finance.view',
      'incidents.view', 'audit.view',
      'market.view', 'content.view',
      'chat.view',
    ],
  },
};

// ── 3. WILDCARD MATCHER ─────────────────────────────────────
// Matches a permission key against a pattern that may include wildcards.
// 'finance.*' matches 'finance.view', 'finance.edit', etc.
// '*' matches everything.

function permissionMatches(pattern, key) {
  if (pattern === '*') return true;
  if (pattern === key) return true;

  const [pNs, pAct] = pattern.split('.');
  const [kNs, kAct] = key.split('.');

  if (pNs === '*' || pNs === kNs) {
    if (pAct === '*' || pAct === kAct) return true;
    // Handle 'finance.*' matching 'finance.view'
    if (pAct === '*' && kAct !== undefined) return true;
  }

  return false;
}

// ── 4. RESOLVE PERMISSIONS FOR A ROLE ──────────────────────
// Returns expanded list of concrete permission keys for a role.

function resolveRolePermissions(roleName) {
  const role = ROLES[roleName];
  if (!role) return [];

  const patterns = role.permissions;
  if (patterns.includes('*')) {
    return PERMISSIONS.map(p => p.key);
  }

  const expanded = new Set();
  for (const pattern of patterns) {
    // If pattern itself is a concrete permission, add it
    if (PERMISSIONS.some(p => p.key === pattern)) {
      expanded.add(pattern);
      continue;
    }
    // Wildcard: match all permissions in namespace
    const [ns, action] = pattern.split('.');
    if (action === '*') {
      PERMISSIONS
        .filter(p => p.namespace === ns)
        .forEach(p => expanded.add(p.key));
    } else if (ns === '*' && action === '*') {
      PERMISSIONS.forEach(p => expanded.add(p.key));
    }
  }

  return [...expanded];
}

// ── 5. HAS PERMISSION CHECK ────────────────────────────────
// Returns true if the permission list contains the required key.

function hasPermission(userPermissions, requiredKey) {
  return userPermissions.some(p => permissionMatches(p, requiredKey));
}

// ── 6. REQUIRED PERMISSION FOR EVERY MODULE ────────────────
// Maps admin dashboard module IDs to required permissions.

const MODULE_PERMISSIONS = {
  overview:           'dashboard.view',
  liveops:            'bookings.view',
  bookings:           'bookings.view',
  ai:                 'chat.view',
  revenue:            'finance.view',
  incidents:          'incidents.view',
  staff:              'staff.view',
  audit:              'audit.view',
  qa:                 'qa.view',
  apikeys:            'api_keys.view',
  settings:           'settings.view',
  users:              'users.view',
  premium:            'users.premium',
  hotels:             'hotels.view',
  promos:             'promos.view',
  flashdeals:         'deals.view',
  market:             'market.view',
  'market-messages':  'market.messages',
  'explore-monitor':  'content.view',
  rbac:               'rbac.view',
  rbac_edit:          'rbac.edit',
  chat:               'chat.view',
  chat_intervene:     'chat.edit',
};

export {
  PERMISSIONS,
  ROLES,
  resolveRolePermissions,
  hasPermission,
  permissionMatches,
  MODULE_PERMISSIONS,
};