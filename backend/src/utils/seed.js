// ═══════════════════════════════════════════════════════════
// RBAC Seed Script — Populates roles, permissions, role_permissions
// RANIA / SANIMAR STUDIO
// Usage: node src/utils/seed.js
// ═══════════════════════════════════════════════════════════

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PERMISSIONS, ROLES, resolveRolePermissions } from '../config/permissions.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function seed() {
  console.log('=== RBAC Seeder ===\n');

  // ── Connect ──────────────────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('⚠ Supabase not configured. Skipping DB seed.');
    console.log('  Permissions are still available in-memory via config/permissions.js');
    console.log('  Run this when a real Supabase instance is configured.\n');
    printSummary();
    process.exit(0);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── 1. Seed Permissions ──────────────────────────────────
  console.log('Seeding permissions...');
  let inserted = 0;
  for (const perm of PERMISSIONS) {
    const { error } = await supabase
      .from('permissions')
      .upsert(
        {
          key: perm.key,
          namespace: perm.namespace,
          action: perm.action,
          description: perm.description,
        },
        { onConflict: 'key', ignoreDuplicates: false }
      );
    if (error && error.code !== '23505') {
      console.error(`  ✗ Failed to insert permission ${perm.key}:`, error.message);
    } else {
      inserted++;
    }
  }
  console.log(`  ✓ ${inserted} permissions inserted/updated (total: ${PERMISSIONS.length})`);

  // ── 2. Seed Roles ────────────────────────────────────────
  console.log('\nSeeding roles...');
  const roleEntries = Object.values(ROLES);
  let roleInserted = 0;
  for (const role of roleEntries) {
    const { error } = await supabase
      .from('roles')
      .upsert(
        {
          name: role.name,
          description: role.description,
          is_system: true,
        },
        { onConflict: 'name', ignoreDuplicates: false }
      );
    if (error && error.code !== '23505') {
      console.error(`  ✗ Failed to insert role ${role.name}:`, error.message);
    } else {
      roleInserted++;
    }
  }
  console.log(`  ✓ ${roleInserted} roles inserted/updated (total: ${roleEntries.length})`);

  // ── 3. Fetch IDs for mapping ─────────────────────────────
  const { data: permData, error: permFetchError } = await supabase
    .from('permissions')
    .select('id, key');
  if (permFetchError) {
    console.error('  ✗ Failed to fetch permission IDs:', permFetchError.message);
    process.exit(1);
  }
  const permMap = {};
  for (const p of permData) {
    permMap[p.key] = p.id;
  }

  const { data: roleData, error: roleFetchError } = await supabase
    .from('roles')
    .select('id, name');
  if (roleFetchError) {
    console.error('  ✗ Failed to fetch role IDs:', roleFetchError.message);
    process.exit(1);
  }
  const roleMap = {};
  for (const r of roleData) {
    roleMap[r.name] = r.id;
  }

  // ── 4. Seed Role_Permissions ─────────────────────────────
  console.log('\nSeeding role_permissions...');
  let rpInserted = 0;
  let rpSkipped = 0;
  for (const [roleName, roleDef] of Object.entries(ROLES)) {
    const roleId = roleMap[roleName];
    if (!roleId) {
      console.error(`  ✗ Role "${roleName}" not found in DB`);
      continue;
    }

    const concretePerms = resolveRolePermissions(roleName);

    for (const permKey of concretePerms) {
      const permId = permMap[permKey];
      if (!permId) {
        console.warn(`  ⚠ Permission "${permKey}" not found in DB — skipping`);
        rpSkipped++;
        continue;
      }

      const { error } = await supabase
        .from('role_permissions')
        .upsert(
          { role_id: roleId, permission_id: permId },
          { onConflict: 'role_id,permission_id', ignoreDuplicates: true }
        );
      if (error && error.code !== '23505') {
        console.error(`  ✗ Failed to link ${roleName} → ${permKey}:`, error.message);
      } else {
        rpInserted++;
      }
    }
  }
  console.log(`  ✓ ${rpInserted} role-permission links inserted`);
  if (rpSkipped > 0) console.log(`  ⚠ ${rpSkipped} skipped (missing permission keys)`);

  console.log('\n=== Seed complete ===');
  printSummary();
}

function printSummary() {
  console.log('\n── Permission Matrix Summary ──\n');
  for (const [roleName, roleDef] of Object.entries(ROLES)) {
    const perms = resolveRolePermissions(roleName);
    const nsMap = {};
    for (const p of perms) {
      const ns = p.split('.')[0];
      if (!nsMap[ns]) nsMap[ns] = [];
      nsMap[ns].push(p);
    }
    console.log(`  ${roleName} (${perms.length} permissions)`);
    for (const [ns, keys] of Object.entries(nsMap)) {
      const actions = keys.map(k => k.split('.')[1]).join(', ');
      console.log(`    ${ns}: ${actions}`);
    }
    console.log('');
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});