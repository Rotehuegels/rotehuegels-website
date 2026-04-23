'use server';

import { cancelBookingByToken } from '@/lib/bookings';
import { sendBookingCancellation } from '@/lib/bookingsEmail';

export async function cancelViaTokenAction(token: string): Promise<{ ok: boolean; error?: string }> {
  const res = await cancelBookingByToken(token, 'visitor');
  if (!res.ok) return { ok: false, error: res.error };
  try {
    await sendBookingCancellation(res.booking, res.eventType, 'visitor');
  } catch (e) {
    console.error('[cancel] email failed', e);
  }
  return { ok: true };
}
