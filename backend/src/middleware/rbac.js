// ═══════════════════════════════════════════════════════════
// RBAC — Authentication & Authorization Middleware
// RANIA / SANIMAR STUDIO
// ═══════════════════════════════════════════════════════════

import jwt from 'jsonwebtoken';
import { resolveRolePermissions, hasPermission } from '../config/permissions.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rania-jwt-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h'; // short-lived per constraint (overridden by .env)

// ── 1. AUTHENTICATE JWT ─────────────────────────────────────
// Extracts and verifies JWT from request.
// Sets req.user = { id, email, role, permissions, tokenVersion }
// Supports optional DB token_version revocation check via asyncValidateTokenVersion callback.

export function authenticate(req, res, next) {
  const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'MISSING_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      tokenVersion: decoded.tver || 0,
    };

    // If an async token version validator was registered on the request,
    // it will be called in a later middleware or route handler.
    // For synchronous scenarios, the middleware below handles it.
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

// ── 1b. TOKEN VERSION REVOCATION CHECK ──────────────────────
// Middleware that runs AFTER authenticate to verify the token_version from
// the JWT matches the current token_version in the DB (if a DB is available).
// This handles the permission revocation edge case without per-request DB joins
// in the normal flow — only called when specifically needed, or can be wired
// as a global check for routes that require sensitive operations.

export function requireTokenVersionValid(getDbUserFn) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    }

    // If no DB lookup function is provided, skip check (mock/dev mode)
    if (!getDbUserFn || typeof getDbUserFn !== 'function') {
      return next();
    }

    try {
      const dbUser = await getDbUserFn(req.user.id);
      
      // User not found in DB — account may have been deleted
      if (!dbUser) {
        return res.status(401).json({
          error: 'User account not found',
          code: 'USER_NOT_FOUND',
        });
      }

      // Check token_version — if DB version is higher, token was revoked
      if (dbUser.token_version > req.user.tokenVersion) {
        return res.status(401).json({
          error: 'Token revoked. Please log in again.',
          code: 'TOKEN_REVOKED',
          details: `DB version ${dbUser.token_version} > token version ${req.user.tokenVersion}`,
        });
      }

      // Optionally refresh user's role/permissions from DB if they changed
      if (dbUser.role && dbUser.role !== req.user.role) {
        req.user.role = dbUser.role;
        req.user.permissions = resolveRolePermissions(dbUser.role);
      }

      next();
    } catch (err) {
      console.error('[RBAC] Token version check error:', err.message);
      // Fail open in dev, fail closed in production
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Authorization check failed', code: 'AUTH_CHECK_FAILED' });
      }
      // In dev, skip the check and log a warning
      console.warn('[RBAC] Token version check skipped due to error — running in dev mode');
      next();
    }
  };
}

// ── 2. GENERATE TOKEN ───────────────────────────────────────
// Creates JWT with minimal payload: sub, role, email, permissions, tver.
// No DB lookup during request — token is self-contained.

export function generateToken(user, permissions) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'admin',
      permissions: permissions || [],
      tver: user.token_version || 0,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// ── 3. REQUIRE ROLE ─────────────────────────────────────────
// Checks that the user has one of the specified roles.

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        code: 'FORBIDDEN_ROLE',
        required: roles,
        current: req.user.role,
      });
    }
    next();
  };
}

// ── 4. REQUIRE PERMISSION ───────────────────────────────────
// Checks that the user has the specified permission key.
// Supports wildcard matching via hasPermission().

export function requirePermission(...permissionKeys) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_USER' });
    }

    const hasAny = permissionKeys.some(key => hasPermission(req.user.permissions, key));

    if (!hasAny) {
      return res.status(403).json({
        error: `Access denied. Required permission: ${permissionKeys.join(' or ')}`,
        code: 'FORBIDDEN_PERMISSION',
        required: permissionKeys,
        current: req.user.role,
        userPermissions: req.user.permissions,
      });
    }
    next();
  };
}

// ── 5. REQUIRE ANY PERMISSION (alias) ───────────────────────
// Same as requirePermission but semantic alias.

export const requireAnyPermission = requirePermission;

// ── 6. PERMISSION CHECK UTILITY (for templates/components) ──
// Can be used in route handlers or view rendering.

export function checkPermission(user, requiredKey) {
  if (!user || !user.permissions) return false;
  return hasPermission(user.permissions, requiredKey);
}

// ── 7. RESOLVE USER PERMISSIONS ─────────────────────────────
// Given a user object with role, returns expanded permissions.
// Optionally includes extra per-user permissions.

export function resolveUserPermissions(user, extraPermissions = [], denyPermissions = []) {
  const rolePerms = resolveRolePermissions(user.role || 'admin');
  
  // Start with role-based permissions
  const finalPerms = new Set(rolePerms);
  
  // Add extra granted permissions
  extraPermissions.forEach(p => finalPerms.add(p));
  
  // Remove denied permissions
  denyPermissions.forEach(p => finalPerms.delete(p));
  
  return [...finalPerms];
}

export default {
  authenticate,
  generateToken,
  requireRole,
  requirePermission,
  requireAnyPermission,
  checkPermission,
  resolveUserPermissions,
  requireTokenVersionValid,
};