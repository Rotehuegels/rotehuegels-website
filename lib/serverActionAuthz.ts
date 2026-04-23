// lib/serverActionAuthz.ts
// Defence-in-depth for server actions. Layout-level guards already gate
// page access, but any mutation that writes to the DB should also verify
// the caller still holds the permission at the moment of the action —
// the layout check happens once per navigation; a server action could
// be called long after the user was (say) deactivated or had rights
// revoked by an admin.
//
// Usage at the top of a 'use server' function:
//   const actor = await requireActorWithPermission('sales.edit');

import 'server-only';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface ServerActionActor {
  userId: string;
  email: string;
  role: 'admin' | 'staff' | 'client';
}

/**
 * Resolves the current authenticated user, verifies active status, and
 * throws if they lack `permission`. Admin users bypass the permission
 * check. Returns the actor identity for audit logging.
 *
 * Throws Error on any failure — let the server action's try/catch (or
 * the Next.js error boundary) surface this back to the caller.
 */
export async function requireActorWithPermission(permission: string): Promise<ServerActionActor> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role ?? 'admin') as 'admin' | 'staff' | 'client';
  if (profile?.is_active === false) throw new Error('Account is deactivated');
  if (role === 'client') throw new Error('Not allowed for client accounts');
  if (role === 'admin') {
    return { userId: user.id, email: user.email ?? '', role };
  }

  const { data: granted } = await supabaseAdmin
    .from('user_permissions')
    .select('permission_key')
    .eq('user_id', user.id)
    .eq('permission_key', permission)
    .maybeSingle();
  if (!granted) throw new Error(`Missing permission: ${permission}`);

  return { userId: user.id, email: user.email ?? '', role };
}

/** Same as above but accepts any of several permissions. Useful when more
 *  than one permission can legitimately grant the action. */
export async function requireActorWithAnyPermission(permissions: string[]): Promise<ServerActionActor> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role ?? 'admin') as 'admin' | 'staff' | 'client';
  if (profile?.is_active === false) throw new Error('Account is deactivated');
  if (role === 'client') throw new Error('Not allowed for client accounts');
  if (role === 'admin') {
    return { userId: user.id, email: user.email ?? '', role };
  }

  const { data: granted } = await supabaseAdmin
    .from('user_permissions')
    .select('permission_key')
    .eq('user_id', user.id)
    .in('permission_key', permissions);
  if (!granted || granted.length === 0) throw new Error(`Missing permission: one of ${permissions.join(', ')}`);

  return { userId: user.id, email: user.email ?? '', role };
}
