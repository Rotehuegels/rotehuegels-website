'use client';

import { useMemo, useState, useTransition } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { bookSlotAction } from './actions';

interface EventTypeLite {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  timezone: string;
  host_name: string;
}

export default function BookingPicker({
  eventType,
  initialSlots,
}: {
  eventType: EventTypeLite;
  initialSlots: string[];
}) {
  const browserTz = useMemo(
    () => (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'),
    [],
  );

  // Group slots by their local-calendar date (in the browser's timezone).
  const slotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of initialSlots) {
      const d = new Date(iso);
      const dayKey = d.toLocaleDateString('en-CA', { timeZone: browserTz }); // YYYY-MM-DD
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)!.push(iso);
    }
    return map;
  }, [initialSlots, browserTz]);

  const availableDays = useMemo(() => [...slotsByDay.keys()].sort(), [slotsByDay]);

  const [selectedDay, setSelectedDay] = useState<string | null>(availableDays[0] ?? null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', topic: '' });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ when: string } | null>(null);

  const slotsForDay = selectedDay ? (slotsByDay.get(selectedDay) ?? []) : [];

  const onSubmit = () => {
    if (!selectedSlot) {
      setError('Pick a time first.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await bookSlotAction({
        eventTypeId: eventType.id,
        startsAt: selectedSlot,
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        phone: form.phone || undefined,
        topic: form.topic || undefined,
        timezone: browserTz,
      });
      if (!res.ok) {
        setError(res.error ?? 'Booking failed.');
        return;
      }
      const fmt = new Intl.DateTimeFormat(undefined, {
        timeZone: browserTz,
        weekday: 'long', day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZoneName: 'short',
      }).format(new Date(selectedSlot));
      setConfirmed({ when: fmt });
    });
  };

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 md:p-10">
        <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-4" />
        <h2 className="text-xl md:text-2xl font-bold mb-2">You&apos;re booked in.</h2>
        <p className="text-sm text-zinc-300 mb-4">
          {eventType.name} with {eventType.host_name} — <strong>{confirmed.when}</strong>.
        </p>
        <p className="text-sm text-zinc-400 mb-2">
          A confirmation email with a calendar invite is on its way to <strong className="text-white">{form.email}</strong>.
          The <code className="text-xs">.ics</code> attachment adds the meeting to any calendar — Google, Microsoft, Apple, or Zoho.
        </p>
        <p className="text-xs text-zinc-500 mt-6">Need to cancel or reschedule? Use the link in the confirmation email.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date strip */}
      {availableDays.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
          No slots available in the next two weeks. Please
          {' '}<a href="mailto:sales@rotehuegels.com" className="text-rose-400 hover:text-rose-300">email us</a>{' '}
          to find a time.
        </div>
      ) : (
        <>
          <DayStrip
            days={availableDays}
            selected={selectedDay}
            onSelect={d => { setSelectedDay(d); setSelectedSlot(null); }}
            browserTz={browserTz}
          />

          {/* Slots */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
              Available times on {selectedDay ? formatDay(selectedDay, browserTz, 'long') : ''} · {browserTz}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slotsForDay.map(iso => {
                const label = new Date(iso).toLocaleTimeString(undefined, {
                  timeZone: browserTz,
                  hour: '2-digit', minute: '2-digit', hour12: true,
                });
                const isSelected = selectedSlot === iso;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedSlot(iso)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10 text-white'
                        : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {slotsForDay.length === 0 && selectedDay && (
              <p className="text-sm text-zinc-500">No openings on this date — pick another day above.</p>
            )}
          </div>

          {/* Form */}
          {selectedSlot && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Your details</p>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full name" required value={form.name}
                  onChange={v => setForm(f => ({ ...f, name: v }))} />
                <Field label="Email" required type="email" value={form.email}
                  onChange={v => setForm(f => ({ ...f, email: v }))} />
                <Field label="Company" value={form.company}
                  onChange={v => setForm(f => ({ ...f, company: v }))} />
                <Field label="Phone (optional)" value={form.phone}
                  onChange={v => setForm(f => ({ ...f, phone: v }))} />
              </div>
              <Field label="What would you like to cover?" multiline rows={3} value={form.topic}
                onChange={v => setForm(f => ({ ...f, topic: v }))} />

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  ← Pick another time
                </button>
                <button
                  onClick={onSubmit}
                  disabled={pending || !form.name || !form.email}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm booking
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── UI bits ──────────────────────────────────────────────────────────────

function DayStrip({
  days, selected, onSelect, browserTz,
}: {
  days: string[]; selected: string | null; onSelect: (d: string) => void; browserTz: string;
}) {
  const [offset, setOffset] = useState(0);
  const pageSize = 7;
  const page = days.slice(offset, offset + pageSize);
  const canPrev = offset > 0;
  const canNext = offset + pageSize < days.length;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canPrev && setOffset(o => Math.max(0, o - pageSize))}
        disabled={!canPrev}
        className="p-2 rounded-lg border border-zinc-800 disabled:opacity-30 hover:border-zinc-600"
        aria-label="Previous dates"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex-1 grid grid-cols-7 gap-2">
        {page.map(d => {
          const isSelected = selected === d;
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className={`rounded-lg border px-2 py-2 text-center transition-colors ${
                isSelected
                  ? 'border-rose-500 bg-rose-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">{formatDay(d, browserTz, 'weekday')}</div>
              <div className="text-sm font-semibold mt-0.5">{formatDay(d, browserTz, 'day')}</div>
              <div className="text-[10px] text-zinc-500">{formatDay(d, browserTz, 'month')}</div>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => canNext && setOffset(o => Math.min(days.length - pageSize, o + pageSize))}
        disabled={!canNext}
        className="p-2 rounded-lg border border-zinc-800 disabled:opacity-30 hover:border-zinc-600"
        aria-label="Next dates"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', required = false, multiline = false, rows,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; multiline?: boolean; rows?: number;
}) {
  const cls = 'w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
        {label}{required && <span className="text-rose-400">*</span>}
      </span>
      {multiline
        ? <textarea rows={rows ?? 3} className={cls} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </label>
  );
}

function formatDay(day: string, tz: string, kind: 'weekday' | 'day' | 'month' | 'long'): string {
  // day is a YYYY-MM-DD string in tz. Convert to a Date in tz noon for safe formatting.
  const [y, m, d] = day.split('-').map(Number);
  // Use UTC noon so timezone conversion doesn't drift the day.
  const iso = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (kind === 'weekday') return new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: 'short' }).format(iso);
  if (kind === 'day')     return new Intl.DateTimeFormat(undefined, { timeZone: tz, day: '2-digit' }).format(iso);
  if (kind === 'month')   return new Intl.DateTimeFormat(undefined, { timeZone: tz, month: 'short' }).format(iso);
  return new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(iso);
}
