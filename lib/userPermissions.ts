// lib/userPermissions.ts
// Server-side user + permission management. Admin users bypass every
// permission check; clients are scoped through portalAuth.ts; staff
// users are governed by the user_permissions table.

import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  VALID_PERMISSION_KEYS,
  type UserRole,
  type UserRow,
} from '@/lib/userPermissions.types';

export type { UserRole, UserRow } from '@/lib/userPermissions.types';
export { PERMISSION_CATALOGUE, VALID_PERMISSION_KEYS } from '@/lib/userPermissions.types';

// ── Fetchers ───────────────────────────────────────────────────────────

export async function listUsers(): Promise<UserRow[]> {
  const { data } = await supabaseAdmin
    .from('user_management_view')
    .select('*')
    .order('auth_created_at', { ascending: false });
  return (data ?? []) as UserRow[];
}

export async function getUser(id: string): Promise<UserRow | null> {
  const { data } = await supabaseAdmin
    .from('user_management_view')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as UserRow | null) ?? null;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('user_permissions')
    .select('permission_key')
    .eq('user_id', userId);
  return (data ?? []).map(r => r.permission_key as string);
}

/**
 * Returns true if the user is allowed. Admin users bypass every check.
 * Clients get permissions from the permission table (rare path — clients
 * normally access only the portal which scopes by customer_id).
 */
export async function hasPermission(userId: string, key: string): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || profile.is_active === false) return false;
  if (profile.role === 'admin') return true;

  const { data } = await supabaseAdmin
    .from('user_permissions')
    .select('permission_key')
    .eq('user_id', userId)
    .eq('permission_key', key)
    .maybeSingle();
  return Boolean(data);
}

// ── Mutations ──────────────────────────────────────────────────────────

export async function grantPermissions(opts: {
  userId: string;
  keys: string[];
  grantedBy: string;
}): Promise<void> {
  const rows = opts.keys
    .filter(k => VALID_PERMISSION_KEYS.has(k))
    .map(k => ({ user_id: opts.userId, permission_key: k, granted_by: opts.grantedBy }));
  if (rows.length === 0) return;
  await supabaseAdmin
    .from('user_permissions')
    .upsert(rows, { onConflict: 'user_id,permission_key' });
}

export async function revokePermissions(opts: {
  userId: string;
  keys: string[];
}): Promise<void> {
  if (opts.keys.length === 0) return;
  await supabaseAdmin
    .from('user_permissions')
    .delete()
    .eq('user_id', opts.userId)
    .in('permission_key', opts.keys);
}

/**
 * Replace the full permission set for a user with the provided keys.
 * Used from the edit form where the checkbox grid represents the
 * authoritative final state.
 */
export async function setPermissions(opts: {
  userId: string;
  keys: string[];
  grantedBy: string;
}): Promise<void> {
  const requested = new Set(opts.keys.filter(k => VALID_PERMISSION_KEYS.has(k)));
  const existing  = new Set(await getUserPermissions(opts.userId));

  const toAdd   = [...requested].filter(k => !existing.has(k));
  const toRemove = [...existing].filter(k => !requested.has(k));

  if (toRemove.length > 0) {
    await supabaseAdmin
      .from('user_permissions')
      .delete()
      .eq('user_id', opts.userId)
      .in('permission_key', toRemove);
  }
  if (toAdd.length > 0) {
    await supabaseAdmin
      .from('user_permissions')
      .insert(toAdd.map(k => ({ user_id: opts.userId, permission_key: k, granted_by: opts.grantedBy })));
  }
}

/** Duplicate another user's permissions onto `targetUserId`. */
export async function copyPermissions(opts: {
  fromUserId: string;
  toUserId: string;
  grantedBy: string;
}): Promise<{ copied: number }> {
  const keys = await getUserPermissions(opts.fromUserId);
  await grantPermissions({ userId: opts.toUserId, keys, grantedBy: opts.grantedBy });
  return { copied: keys.length };
}

// ── Supabase Auth helpers ──────────────────────────────────────────────

export async function createStaffUser(opts: {
  email: string;
  password: string;
  displayName: string;
  phone?: string | null;
  role: UserRole;                    // 'staff' for normal internal hires; 'admin' for peers
  customerId?: string | null;        // only for role='client'
  notes?: string | null;
  copyRightsFromUserId?: string | null;
  createdBy: string;
}): Promise<{ userId: string; copied: number }> {
  // Admin API creates the auth row with email/password already confirmed.
  const { data: authRes, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: opts.email.trim().toLowerCase(),
    password: opts.password,
    email_confirm: true,
    user_metadata: { display_name: opts.displayName, created_by: opts.createdBy },
  });
  if (authErr || !authRes?.user) {
    throw new Error(authErr?.message ?? 'Could not create auth user.');
  }
  const userId = authRes.user.id;

  // Profile row (the trigger already created one with role='admin' — overwrite).
  await supabaseAdmin
    .from('user_profiles')
    .upsert({
      id: userId,
      role: opts.role,
      display_name: opts.displayName,
      phone: opts.phone ?? null,
      notes: opts.notes ?? null,
      customer_id: opts.role === 'client' ? (opts.customerId ?? null) : null,
      is_active: true,
    }, { onConflict: 'id' });

  // Copy rights from an existing user, if asked.
  let copied = 0;
  if (opts.role === 'staff' && opts.copyRightsFromUserId) {
    const res = await copyPermissions({
      fromUserId: opts.copyRightsFromUserId,
      toUserId: userId,
      grantedBy: opts.createdBy,
    });
    copied = res.copied;
  }
  return { userId, copied };
}

export async function updateUser(opts: {
  userId: string;
  role?: UserRole;
  displayName?: string;
  phone?: string | null;
  notes?: string | null;
  customerId?: string | null;
  isActive?: boolean;
}): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (opts.role !== undefined)        patch.role = opts.role;
  if (opts.displayName !== undefined) patch.display_name = opts.displayName;
  if (opts.phone !== undefined)       patch.phone = opts.phone;
  if (opts.notes !== undefined)       patch.notes = opts.notes;
  if (opts.customerId !== undefined)  patch.customer_id = opts.customerId;
  if (opts.isActive !== undefined)    patch.is_active = opts.isActive;
  await supabaseAdmin.from('user_profiles').update(patch).eq('id', opts.userId);
}

export async function resetUserPassword(opts: {
  userId: string;
  newPassword: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(opts.userId, {
    password: opts.newPassword,
  });
  if (error) throw new Error(error.message);
}

export async function deactivateUser(userId: string): Promise<void> {
  await supabaseAdmin.from('user_profiles').update({ is_active: false }).eq('id', userId);
}
