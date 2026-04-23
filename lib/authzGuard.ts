// lib/authzGuard.ts
// Server-side permission guards for internal dashboard routes.
// Call from a layout.tsx or page.tsx — unauthenticated users get redirected
// to /login, authenticated-but-unauthorised staff/clients get redirected
// to /d/forbidden with the missing permission in the query string.

import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function currentUserRoleAndPerms(): Promise<{
  userId: string;
  role: 'admin' | 'staff' | 'client' | null;
  isActive: boolean;
  permissions: Set<string>;
} | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role ?? 'admin') as 'admin' | 'staff' | 'client';
  const isActive = profile?.is_active !== false;

  // Admins skip the permission table — they implicitly hold everything.
  if (role === 'admin') {
    return { userId: user.id, role, isActive, permissions: new Set<string>() };
  }

  const { data: perms } = await supabaseAdmin
    .from('user_permissions')
    .select('permission_key')
    .eq('user_id', user.id);

  return {
    userId: user.id,
    role,
    isActive,
    permissions: new Set((perms ?? []).map(p => p.permission_key as string)),
  };
}

/**
 * Redirects to /login if unauthenticated, /d/forbidden if signed in but
 * lacking the given permission. Admins bypass every check. Returns
 * silently when allowed.
 */
export async function requirePermission(key: string): Promise<void> {
  const ctx = await currentUserRoleAndPerms();
  if (!ctx) redirect('/login?next=/d');
  if (!ctx.isActive) redirect('/login?reason=deactivated');

  // Client users don't belong on internal dashboard routes — send home.
  if (ctx.role === 'client') redirect('/portal');

  if (ctx.role === 'admin') return;
  if (!ctx.permissions.has(key)) redirect(`/d/forbidden?need=${encodeURIComponent(key)}`);
}

/**
 * Like requirePermission but passes when the user has ANY of the keys.
 * Useful when a page reads from multiple modules.
 */
export async function requireAnyPermission(keys: string[]): Promise<void> {
  const ctx = await currentUserRoleAndPerms();
  if (!ctx) redirect('/login?next=/d');
  if (!ctx.isActive) redirect('/login?reason=deactivated');
  if (ctx.role === 'client') redirect('/portal');
  if (ctx.role === 'admin') return;
  if (!keys.some(k => ctx.permissions.has(k))) redirect(`/d/forbidden?need=${encodeURIComponent(keys.join(','))}`);
}

/**
 * Returns the full permission context. Use from server components that
 * need to conditionally render pieces of UI (e.g. hide the "Delete"
 * button if the user lacks the edit permission).
 */
export async function getPermissionContext(): Promise<{
  role: 'admin' | 'staff' | 'client' | null;
  permissions: Set<string>;
} | null> {
  const ctx = await currentUserRoleAndPerms();
  if (!ctx) return null;
  return { role: ctx.role, permissions: ctx.permissions };
}

/**
 * Boolean helper for inline checks.
 * `await can('sales.edit')` → true | false.
 * Admins always get true. Unauthenticated → false.
 */
export async function can(key: string): Promise<boolean> {
  const ctx = await currentUserRoleAndPerms();
  if (!ctx) return false;
  if (!ctx.isActive) return false;
  if (ctx.role === 'admin') return true;
  return ctx.permissions.has(key);
}
