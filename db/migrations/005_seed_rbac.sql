-- ============================================================
-- MIGRATION 005: RBAC Seed — Roles + Permissions + Role Permissions
-- Project: RANIA / SANIMAR STUDIO
-- Must run AFTER 004_rbac.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SEED PERMISSIONS
-- All permission keys from backend/src/config/permissions.js
-- ────────────────────────────────────────────────────────────
INSERT INTO permissions (key, namespace, action, description) VALUES
  ('dashboard.view',     'dashboard', 'view',   'View dashboard overview'),

  ('users.view',         'users',      'view',   'View user list & profiles'),
  ('users.edit',         'users',      'edit',   'Edit user details'),
  ('users.ban',          'users',      'ban',    'Ban/unban users'),
  ('users.premium',      'users',      'premium','Manage premium subscriptions'),

  ('bookings.view',      'bookings',   'view',   'View booking list & details'),
  ('bookings.edit',      'bookings',   'edit',   'Modify bookings (status, price)'),
  ('bookings.cancel',    'bookings',   'cancel', 'Cancel bookings'),
  ('bookings.refund',    'bookings',   'refund', 'Process refunds'),
  ('bookings.fraud',     'bookings',   'fraud',  'Review fraud flags'),
  ('bookings.export',    'bookings',   'export', 'Export bookings CSV/PDF'),

  ('finance.view',       'finance',    'view',   'View revenue dashboard'),
  ('finance.export',     'finance',    'export', 'Export financial reports'),
  ('finance.edit',       'finance',    'edit',   'Edit pricing / markup settings'),
  ('finance.commission', 'finance',    'commission', 'View commission data'),

  ('incidents.view',     'incidents',  'view',   'View incident log'),
  ('incidents.edit',     'incidents',  'edit',   'Resolve/update incidents'),

  ('staff.view',         'staff',      'view',   'View staff list & performance'),
  ('staff.edit',         'staff',      'edit',   'Add/remove staff, change roles'),

  ('market.view',        'market',     'view',   'View marketplace listings'),
  ('market.edit',        'market',     'edit',   'Approve/reject/suspend listings'),
  ('market.messages',    'market',     'messages','Monitor market conversations'),

  ('content.view',       'content',    'view',   'View explore posts'),
  ('content.edit',       'content',    'edit',   'Publish/hide/delete posts'),

  ('hotels.view',        'hotels',     'view',   'View hotel partners'),
  ('hotels.edit',        'hotels',     'edit',   'Add/edit/suspend hotels'),

  ('promos.view',        'promos',     'view',   'View promo codes'),
  ('promos.edit',        'promos',     'edit',   'Create/disable promos'),
  ('deals.view',         'deals',      'view',   'View flash deals'),
  ('deals.edit',         'deals',      'edit',   'Create/stop flash deals'),

  ('qa.view',            'qa',         'view',   'View QA scores & reports'),
  ('qa.trigger',         'qa',         'trigger','Trigger QA test runs'),

  ('audit.view',         'audit',      'view',   'View audit logs'),
  ('audit.export',       'audit',      'export', 'Export audit trail'),

  ('api_keys.view',      'api_keys',   'view',   'View API key status'),
  ('api_keys.edit',      'api_keys',   'edit',   'Update/test API keys'),

  ('settings.view',      'settings',   'view',   'View system settings'),
  ('settings.edit',      'settings',   'edit',   'Modify system settings'),

  ('rbac.view',          'rbac',       'view',   'View role & permission assignments'),
  ('rbac.edit',          'rbac',       'edit',   'Modify roles/permissions/users'),

  ('chat.view',          'chat',       'view',   'View chat logs & AI conversations'),
  ('chat.edit',          'chat',       'edit',   'Intervene in AI conversations')
ON CONFLICT (key) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. SEED ROLES
-- ────────────────────────────────────────────────────────────
INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin',        'Full system access — all permissions',                     TRUE),
  ('admin',              'Administrative access — all management tools',             TRUE),
  ('operations',         'Daily operations — bookings, incidents, reports',          TRUE),
  ('finance',            'Financial access — revenue, commission, exports',          TRUE),
  ('support',            'Customer support — bookings, users, chat',                 TRUE),
  ('content_moderator',  'Content & marketplace moderation',                        TRUE),
  ('read_only_auditor',  'Read-only audit access — compliance',                     TRUE)
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. SEED ROLE_PERMISSIONS
-- Maps each role to concrete permission IDs
-- ────────────────────────────────────────────────────────────
-- Helper: use a CTE to resolve permission IDs by key
WITH
perm_ids AS (
  SELECT id, key FROM permissions
),
role_ids AS (
  SELECT id, name FROM roles
)

-- super_admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin: all namespaces
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
  AND (p.namespace IN (
        'dashboard','users','bookings','finance','incidents','staff',
        'market','content','hotels','promos','deals','qa',
        'audit','api_keys','settings','rbac','chat'
      ))
ON CONFLICT DO NOTHING;

-- operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'operations'
  AND (
    p.key IN (
      'dashboard.view',
      'incidents.view', 'incidents.edit',
      'users.view',
      'finance.view',
      'qa.view',
      'chat.view'
    )
    OR p.namespace = 'bookings'
  )
ON CONFLICT DO NOTHING;

-- finance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'finance'
  AND (
    p.key IN (
      'dashboard.view',
      'bookings.view', 'bookings.export',
      'audit.view',
      'users.view'
    )
    OR p.namespace = 'finance'
  )
ON CONFLICT DO NOTHING;

-- support
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'support'
  AND (
    p.key IN (
      'dashboard.view',
      'bookings.view',
      'users.view',
      'incidents.view'
    )
    OR p.namespace = 'chat'
  )
ON CONFLICT DO NOTHING;

-- content_moderator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'content_moderator'
  AND (
    p.key = 'dashboard.view'
    OR p.namespace IN ('market', 'content')
  )
ON CONFLICT DO NOTHING;

-- read_only_auditor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'read_only_auditor'
  AND (
    p.key IN (
      'dashboard.view',
      'users.view',
      'bookings.view',
      'finance.view',
      'incidents.view',
      'audit.view',
      'market.view',
      'content.view',
      'chat.view'
    )
  )
ON CONFLICT DO NOTHING;