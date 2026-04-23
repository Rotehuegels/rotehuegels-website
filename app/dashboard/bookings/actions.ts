'use server';

import { supabaseServer } from '@/lib/supabaseServer';
import { cancelBookingByToken } from '@/lib/bookings';
import { sendBookingCancellation } from '@/lib/bookingsEmail';

export async function cancelBookingAsHostAction(token: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const res = await cancelBookingByToken(token, 'host');
  if (!res.ok) return { ok: false, error: res.error };
  try {
    await sendBookingCancellation(res.booking, res.eventType, 'host');
  } catch (e) {
    console.error('[dashboard cancel] email failed', e);
  }
  return { ok: true };
}
