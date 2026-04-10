'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Server action — signs the user out and redirects.
 * Running signOut on the server guarantees the session cookie is cleared
 * in the HTTP response *before* the browser navigates away, eliminating
 * the race condition that caused "This page couldn't load" on logout.
 */
export async function signOutAction(redirectTo: string = '/login') {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect(redirectTo);
}
