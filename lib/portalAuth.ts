// lib/portalAuth.ts
// Auth helper for the client portal.
// Verifies the user is a client and returns their customer_id.

import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface PortalUser {
  userId: string;
  email: string;
  role: 'client';
  customerId: string;
  displayName: string | null;
}

export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, customer_id, display_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'client' || !profile.customer_id) return null;

  return {
    userId: user.id,
    email: user.email ?? '',
    role: 'client',
    customerId: profile.customer_id,
    displayName: profile.display_name,
  };
}

/** Check if the authenticated user is an admin */
export async function getUserRole(): Promise<'admin' | 'client' | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // If no profile exists (legacy user), treat as admin
  if (!profile) return 'admin';
  return profile.role as 'admin' | 'client';
}
