// lib/bookings.ts
// Server-side booking logic — slot generation + create/cancel actions.
// All time arithmetic is done in the event type's timezone (IANA string);
// database stores UTC (timestamptz).

import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  weekly_availability: WeeklyAvailability;
  timezone: string;
  min_notice_hours: number;
  max_days_ahead: number;
  host_name: string;
  host_email: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  event_type_id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_company: string | null;
  visitor_phone: string | null;
  visitor_topic: string | null;
  visitor_timezone: string | null;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  cancel_token: string;
  created_at: string;
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type AvailabilityWindow = { start: string; end: string }; // "HH:MM"
type WeeklyAvailability = Partial<Record<DayKey, AvailabilityWindow[]>>;

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export async function getEventTypeBySlug(slug: string): Promise<EventType | null> {
  const { data, error } = await supabaseAdmin
    .from('booking_event_types')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as EventType;
}

export async function listEventTypes(): Promise<EventType[]> {
  const { data } = await supabaseAdmin
    .from('booking_event_types')
    .select('*')
    .eq('is_active', true)
    .order('duration_minutes');
  return (data ?? []) as EventType[];
}

// ── Slot generation ──────────────────────────────────────────────────────

/**
 * Return an array of available slot start times (ISO UTC strings) for the
 * given event type over the next `max_days_ahead` days, excluding slots that
 * collide with existing confirmed bookings (applying buffers) or fall inside
 * the min-notice window.
 */
export async function generateSlots(et: EventType): Promise<string[]> {
  const now = new Date();
  const earliest = new Date(now.getTime() + et.min_notice_hours * 3600 * 1000);
  const latest = new Date(now.getTime() + et.max_days_ahead * 86400 * 1000);

  // Pull all confirmed bookings in the window so we can exclude overlapping slots.
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('event_type_id', et.id)
    .eq('status', 'confirmed')
    .gte('ends_at', earliest.toISOString())
    .lte('starts_at', latest.toISOString());
  const bookedRanges = (existing ?? []).map(r => ({
    start: new Date(r.starts_at).getTime(),
    end: new Date(r.ends_at).getTime(),
  }));

  const slotStep = et.duration_minutes * 60 * 1000;

  const slots: string[] = [];
  // Iterate day by day in the event type's timezone.
  const zone = et.timezone;
  const dayCursor = startOfDayInZone(earliest, zone);
  const endDay = startOfDayInZone(latest, zone);
  for (let d = new Date(dayCursor); d <= endDay; d = addDays(d, 1)) {
    const dayKey = dayKeyInZone(d, zone);
    const windows = et.weekly_availability[dayKey] ?? [];
    for (const w of windows) {
      const windowStart = composeDateInZone(d, w.start, zone);
      const windowEnd   = composeDateInZone(d, w.end, zone);
      for (let t = windowStart.getTime(); t + slotStep <= windowEnd.getTime() + 1; t += slotStep) {
        const slotStart = t;
        const slotEnd   = t + slotStep;
        // Respect min-notice / max-ahead.
        if (slotStart < earliest.getTime()) continue;
        if (slotStart > latest.getTime()) continue;
        // Apply buffers when checking conflicts.
        const bufferedStart = slotStart - et.buffer_before_minutes * 60 * 1000;
        const bufferedEnd   = slotEnd   + et.buffer_after_minutes  * 60 * 1000;
        const conflict = bookedRanges.some(b =>
          bufferedStart < b.end && bufferedEnd > b.start,
        );
        if (conflict) continue;
        slots.push(new Date(slotStart).toISOString());
      }
    }
  }
  return slots;
}

// ── Timezone helpers (no external dep — Intl only) ──────────────────────
//
// Compose an absolute Date from a Y/M/D (taken from `day` in the given zone)
// and a "HH:MM" wall-clock time, interpreting the wall-clock in the same zone.
// Works correctly across DST transitions because we round-trip through Intl.

function getZonedParts(date: Date, zone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    weekday: 'short', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
  return {
    year:    Number(parts.year),
    month:   Number(parts.month),
    day:     Number(parts.day),
    hour:    Number(parts.hour === '24' ? '00' : parts.hour),
    minute:  Number(parts.minute),
    second:  Number(parts.second),
    weekday: (parts.weekday ?? '').toLowerCase().slice(0, 3),
  };
}

function dayKeyInZone(date: Date, zone: string): DayKey {
  const wk = getZonedParts(date, zone).weekday;
  // Intl returns "mon"/"tue"/etc.
  return (DAY_KEYS.includes(wk as DayKey) ? wk : 'mon') as DayKey;
}

function startOfDayInZone(date: Date, zone: string): Date {
  const p = getZonedParts(date, zone);
  return composeDateInZone(new Date(Date.UTC(p.year, p.month - 1, p.day)), '00:00', zone);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400 * 1000);
}

// Given a Date whose zoned Y-M-D we want, and a wall-clock "HH:MM" in zone,
// return an absolute Date pointing at that wall-clock moment in that zone.
function composeDateInZone(day: Date, hhmm: string, zone: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const p = getZonedParts(day, zone);
  // First guess: treat the wall-clock as UTC.
  const guess = new Date(Date.UTC(p.year, p.month - 1, p.day, h, m, 0));
  // Measure the zone's UTC offset at that moment and correct.
  const parts = getZonedParts(guess, zone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offsetMs = asUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

// ── Create + cancel ──────────────────────────────────────────────────────

export interface CreateBookingInput {
  eventTypeId: string;
  startsAt: string;   // ISO UTC from the slot list
  visitor: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    topic?: string;
    timezone?: string;
  };
}

export interface CreateBookingResult {
  ok: boolean;
  booking?: Booking;
  eventType?: EventType;
  error?: 'event_not_found' | 'slot_not_available' | 'validation' | 'unknown';
  message?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  // Basic validation
  const email = input.visitor.email?.trim().toLowerCase();
  const name  = input.visitor.name?.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'validation', message: 'A valid email is required.' };
  }
  if (!name || name.length < 2) {
    return { ok: false, error: 'validation', message: 'Please share your name.' };
  }

  // Load event type
  const { data: et } = await supabaseAdmin
    .from('booking_event_types')
    .select('*')
    .eq('id', input.eventTypeId)
    .eq('is_active', true)
    .maybeSingle();
  if (!et) return { ok: false, error: 'event_not_found', message: 'This event type is not available.' };
  const eventType = et as EventType;

  const startsAt = new Date(input.startsAt);
  if (isNaN(startsAt.getTime())) {
    return { ok: false, error: 'validation', message: 'Invalid slot time.' };
  }
  const endsAt = new Date(startsAt.getTime() + eventType.duration_minutes * 60 * 1000);

  // Verify the slot is still free — the DB exclusion constraint is the final
  // arbiter, but this gives a friendlier error than a raw SQL exception.
  const availableSlots = await generateSlots(eventType);
  const isAvailable = availableSlots.includes(startsAt.toISOString());
  if (!isAvailable) {
    return { ok: false, error: 'slot_not_available', message: 'That slot was just taken — please pick another.' };
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      event_type_id: eventType.id,
      visitor_name: name,
      visitor_email: email,
      visitor_company: input.visitor.company?.trim() || null,
      visitor_phone: input.visitor.phone?.trim() || null,
      visitor_topic: input.visitor.topic?.trim() || null,
      visitor_timezone: input.visitor.timezone ?? null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
    })
    .select('*')
    .single();

  if (error) {
    // Likely an exclusion-constraint violation — slot taken by a race.
    if ((error as { code?: string }).code === '23P01') {
      return { ok: false, error: 'slot_not_available', message: 'That slot was just taken — please pick another.' };
    }
    console.error('[bookings] insert failed', error);
    return { ok: false, error: 'unknown', message: 'Booking could not be saved. Please try again.' };
  }

  return { ok: true, booking: data as Booking, eventType };
}

export async function cancelBookingByToken(token: string, cancelledBy: 'visitor' | 'host'): Promise<
  { ok: true; booking: Booking; eventType: EventType } | { ok: false; error: string }
> {
  const { data: b } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .maybeSingle();
  if (!b) return { ok: false, error: 'not_found' };
  if (b.status === 'cancelled') {
    const et = await getEventTypeById(b.event_type_id);
    return et ? { ok: true, booking: b as Booking, eventType: et } : { ok: false, error: 'event_not_found' };
  }

  const { data: upd, error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
    })
    .eq('cancel_token', token)
    .select('*')
    .single();
  if (error || !upd) return { ok: false, error: 'update_failed' };
  const et = await getEventTypeById(upd.event_type_id);
  return et
    ? { ok: true, booking: upd as Booking, eventType: et }
    : { ok: false, error: 'event_not_found' };
}

export async function getEventTypeById(id: string): Promise<EventType | null> {
  const { data } = await supabaseAdmin
    .from('booking_event_types')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as EventType | null) ?? null;
}
