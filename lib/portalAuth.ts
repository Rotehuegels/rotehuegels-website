// lib/portalAuth.ts
// Auth helper for the client portal — and, by design, the master-login
// gate for any surface that wants to let Rotehügels admins view as a
// client in preview mode.
//
// Rules:
// - Unauthenticated user → null (caller should redirect to /login).
// - user_profiles.role === 'client' with a customer_id → returns a client
//   scoped to that customer (normal path).
// - user_profiles.role === 'admin' (or a legacy user with NO profile row,
//   which we treat as admin) → returns an admin "master" user. The
//   customer_id is derived from an optional projectId hint; without a
//   hint, customerId is null and the caller should render a
//   choose-a-project landing.
//
// Every sub-page that already filters by portalUser.customerId keeps
// working — for an admin with projectId, customerId is the owner of the
// project, so the filter matches. An admin visiting /portal (no project
// context) falls through to the admin "all projects" landing.

import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type PortalRole = 'client' | 'admin' | 'staff';

export interface PortalUser {
  userId: string;
  email: string;
  role: PortalRole;
  customerId: string | null;   // null only for admin visiting root without a project
  displayName: string | null;
  isAdmin: boolean;            // true when role === 'admin' — used for preview banner + "show all"
}

export async function getPortalUser(opts?: { projectId?: string }): Promise<PortalUser | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, customer_id, display_name')
    .eq('id', user.id)
    .maybeSingle();

  // Client path — unchanged.
  if (profile?.role === 'client' && profile.customer_id) {
    return {
      userId: user.id,
      email: user.email ?? '',
      role: 'client',
      customerId: profile.customer_id,
      displayName: profile.display_name ?? null,
      isAdmin: false,
    };
  }

  // Admin / master-login path. Treat missing profile as admin (legacy users).
  const isAdmin = !profile || profile.role === 'admin';
  if (!isAdmin) return null;

  // Derive the customer scope from the current project (if any).
  let customerId: string | null = null;
  if (opts?.projectId) {
    const { data: proj } = await supabaseAdmin
      .from('projects')
      .select('customer_id')
      .eq('id', opts.projectId)
      .maybeSingle();
    customerId = proj?.customer_id ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    role: 'admin',
    customerId,
    displayName: profile?.display_name ?? 'Admin preview',
    isAdmin: true,
  };
}

/** Returns the authenticated user's effective role, or null if not signed in. */
export async function getUserRole(): Promise<PortalRole | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return 'admin'; // legacy users treated as admin
  return profile.role as PortalRole;
}
