'use server';

import { requireActorWithPermission } from '@/lib/serverActionAuthz';
import { cancelBookingByToken } from '@/lib/bookings';
import { sendBookingCancellation } from '@/lib/bookingsEmail';

export async function cancelBookingAsHostAction(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireActorWithPermission('bookings.manage');
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unauthorised' };
  }

  const res = await cancelBookingByToken(token, 'host');
  if (!res.ok) return { ok: false, error: res.error };
  try {
    await sendBookingCancellation(res.booking, res.eventType, 'host');
  } catch (e) {
    console.error('[dashboard cancel] email failed', e);
  }
  return { ok: true };
}
