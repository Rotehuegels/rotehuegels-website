import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Metadata } from 'next';
import CancelAction from './CancelAction';

export const metadata: Metadata = {
  title: 'Cancel booking — Rotehügels',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function CancelBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, starts_at, status, visitor_name, visitor_email,
      event_type:booking_event_types ( name, duration_minutes, timezone )
    `)
    .eq('cancel_token', token)
    .maybeSingle();

  if (!booking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-[700px] mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Booking not found</h1>
          <p className="text-sm text-zinc-400">This cancel link is invalid or already expired.</p>
          <Link href="/" className="inline-block mt-6 text-sm text-rose-400 hover:text-rose-300 no-underline">Back to Rotehügels →</Link>
        </div>
      </div>
    );
  }

  type Row = {
    id: string; starts_at: string; status: string;
    visitor_name: string; visitor_email: string;
    event_type: { name: string; duration_minutes: number; timezone: string } | null;
  };
  const b = booking as unknown as Row;

  const fmtHost = b.event_type
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: b.event_type.timezone,
        weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short',
      }).format(new Date(b.starts_at))
    : '';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[700px] mx-auto px-6 py-20">
        <h1 className="text-2xl md:text-3xl font-bold mb-3">Cancel your booking</h1>
        <p className="text-sm text-zinc-400 mb-8">This removes the meeting for both sides and sends a cancellation notice with an updated calendar invite.</p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Event</p>
          <p className="text-base font-semibold text-white">{b.event_type?.name ?? 'Booking'}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-4 mb-1">When</p>
          <p className="text-sm text-zinc-200">{fmtHost}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-4 mb-1">Booked by</p>
          <p className="text-sm text-zinc-200">{b.visitor_name} · {b.visitor_email}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-4 mb-1">Status</p>
          <p className={`text-sm font-semibold ${b.status === 'cancelled' ? 'text-zinc-500' : 'text-emerald-400'}`}>{b.status === 'cancelled' ? 'Already cancelled' : 'Confirmed'}</p>
        </div>

        {b.status === 'cancelled'
          ? <p className="text-sm text-zinc-400">Nothing to do — this booking was already cancelled.</p>
          : <CancelAction token={token} />}
      </div>
    </div>
  );
}
