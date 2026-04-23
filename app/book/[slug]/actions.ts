'use server';

import { createBooking } from '@/lib/bookings';
import { sendBookingConfirmation } from '@/lib/bookingsEmail';

export interface BookActionResult {
  ok: boolean;
  error?: string;
  bookingId?: string;
}

export async function bookSlotAction(form: {
  eventTypeId: string;
  startsAt: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  topic?: string;
  timezone?: string;
}): Promise<BookActionResult> {
  const result = await createBooking({
    eventTypeId: form.eventTypeId,
    startsAt: form.startsAt,
    visitor: {
      name: form.name,
      email: form.email,
      company: form.company,
      phone: form.phone,
      topic: form.topic,
      timezone: form.timezone,
    },
  });

  if (!result.ok || !result.booking || !result.eventType) {
    return { ok: false, error: result.message ?? 'Booking failed' };
  }

  try {
    await sendBookingConfirmation(result.booking, result.eventType);
  } catch (e) {
    // Log but still report success — the booking row is saved; we can resend
    // the confirmation manually from the dashboard if email transport blipped.
    console.error('[book] confirmation email failed', e);
  }

  return { ok: true, bookingId: result.booking.id };
}
