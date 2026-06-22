-- ============================================================
-- MIGRATION 004: RBAC — Full Role-Based Access Control
-- Project: RANIA / SANIMAR STUDIO
-- Date: 2026-06-21
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ROLES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  is_system   BOOLEAN DEFAULT FALSE,   -- system roles can't be deleted
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. PERMISSIONS
-- Stored as namespaced dot-notation keys, e.g. "users.ban"
-- Wildcard: "users.*" expands to all users.* permissions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(128) UNIQUE NOT NULL,  -- e.g. "finance.view"
  namespace   VARCHAR(64) NOT NULL,          -- e.g. "finance"
  action      VARCHAR(64) NOT NULL,          -- e.g. "view"
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. ROLE_PERMISSIONS (join table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ────────────────────────────────────────────────────────────
-- 4. USER_ROLES (one user = one role + optional extra perms)
-- ────────────────────────────────────────────────────────────
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_ip INET;

-- ────────────────────────────────────────────────────────────
-- 5. USER_EXTRA_PERMISSIONS (per-user permission overrides)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_extra_permissions (
  user_id       INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN DEFAULT TRUE,   -- TRUE = grant, FALSE = deny
  granted_by    INTEGER REFERENCES admin_users(id),
  granted_at    TIMESTAMPTZ DEFAULT NOW(),
  reason        TEXT,
  PRIMARY KEY (user_id, permission_id)
);

-- ────────────────────────────────────────────────────────────
-- 6. AUDIT_ROLE_CHANGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_role_changes (
  id            SERIAL PRIMARY KEY,
  target_user   INTEGER REFERENCES admin_users(id),
  changed_by    INTEGER REFERENCES admin_users(id),
  old_role_id   INTEGER REFERENCES roles(id),
  new_role_id   INTEGER REFERENCES roles(id),
  ip            INET,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 7. INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_role_target ON audit_role_changes(target_user);
CREATE INDEX IF NOT EXISTS idx_permissions_ns ON permissions(namespace);

-- ────────────────────────────────────────────────────────────
-- 8. UPDATED_AT TRIGGER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE roles IS 'RBAC role definitions';
COMMENT ON TABLE permissions IS 'Fine-grained permission keys (namespace.action)';
COMMENT ON TABLE role_permissions IS 'Many-to-many: roles to permissions';
COMMENT ON TABLE user_extra_permissions IS 'Per-user permission overrides (grant or deny)';
COMMENT ON TABLE audit_role_changes IS 'Append-only audit trail for role assignments';