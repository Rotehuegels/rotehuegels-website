import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CalendarClock, Mail, Phone, Building2, ExternalLink } from 'lucide-react';
import CancelBookingButton from './CancelBookingButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  visitor_name: string;
  visitor_email: string;
  visitor_company: string | null;
  visitor_phone: string | null;
  visitor_topic: string | null;
  visitor_timezone: string | null;
  cancel_token: string;
  created_at: string;
  event_type: { slug: string; name: string; duration_minutes: number; timezone: string } | null;
};

export default async function BookingsDashboardPage() {
  const { data } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, starts_at, ends_at, status,
      visitor_name, visitor_email, visitor_company, visitor_phone, visitor_topic, visitor_timezone,
      cancel_token, created_at,
      event_type:booking_event_types ( slug, name, duration_minutes, timezone )
    `)
    .order('starts_at', { ascending: true });

  const rows = (data ?? []) as unknown as Row[];
  const now = Date.now();
  const upcoming = rows.filter(r => r.status === 'confirmed' && new Date(r.ends_at).getTime() >= now);
  const past     = rows.filter(r => r.status === 'completed' || (r.status === 'confirmed' && new Date(r.ends_at).getTime() < now));
  const cancelled = rows.filter(r => r.status === 'cancelled');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-10 space-y-10">

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-2">Internal</p>
          <h1 className="text-2xl md:text-3xl font-bold">Bookings</h1>
          <p className="text-sm text-zinc-400 mt-1">Every demo / consultation booked through <code>/book/*</code>. Calendar feed URL at the bottom of this page.</p>
        </div>

        <BookingsTable title="Upcoming" rows={upcoming} emptyLabel="No upcoming bookings yet." showCancel />
        <BookingsTable title="Past" rows={past} emptyLabel="No past bookings yet." />
        <BookingsTable title="Cancelled" rows={cancelled} emptyLabel="No cancelled bookings." dimmed />

        <SubscribeHelp />
      </div>
    </div>
  );
}

function BookingsTable({
  title, rows, emptyLabel, showCancel, dimmed,
}: {
  title: string; rows: Row[]; emptyLabel: string; showCancel?: boolean; dimmed?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h2>
        <span className="text-xs text-zinc-500">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">{emptyLabel}</div>
      ) : (
        <div className={`rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden ${dimmed ? 'opacity-75' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/30">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="text-left font-medium px-4 py-3">When (host TZ)</th>
                  <th className="text-left font-medium px-4 py-3">Event</th>
                  <th className="text-left font-medium px-4 py-3">Visitor</th>
                  <th className="text-left font-medium px-4 py-3">Contact</th>
                  <th className="text-left font-medium px-4 py-3">Topic</th>
                  {showCancel && <th className="text-right font-medium px-4 py-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rows.map(r => {
                  const tz = r.event_type?.timezone ?? 'Asia/Kolkata';
                  const whenHost = new Intl.DateTimeFormat('en-IN', {
                    timeZone: tz,
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  }).format(new Date(r.starts_at));
                  return (
                    <tr key={r.id} className="hover:bg-zinc-800/20">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span className="text-zinc-200">{whenHost}</span>
                        </div>
                        {r.visitor_timezone && r.visitor_timezone !== tz && (
                          <div className="text-[10px] text-zinc-500 mt-0.5 ml-5">{r.visitor_timezone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-200">{r.event_type?.name ?? '—'}</div>
                        <div className="text-[10px] text-zinc-500">{r.event_type?.duration_minutes} min</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-200 font-medium">{r.visitor_name}</div>
                        {r.visitor_company && (
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" /> {r.visitor_company}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${r.visitor_email}`} className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300">
                          <Mail className="h-3 w-3" /> {r.visitor_email}
                        </a>
                        {r.visitor_phone && (
                          <div className="mt-1">
                            <a href={`tel:${r.visitor_phone}`} className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                              <Phone className="h-3 w-3" /> {r.visitor_phone}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[280px] whitespace-pre-wrap break-words">
                        {r.visitor_topic ?? <span className="text-zinc-600">—</span>}
                      </td>
                      {showCancel && (
                        <td className="px-4 py-3 text-right">
                          <CancelBookingButton token={r.cancel_token} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function SubscribeHelp() {
  const tokenSet = Boolean(process.env.CALENDAR_SUBSCRIBE_SECRET);
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Calendar subscribe URL</h2>
      <p className="text-sm text-zinc-400 mb-3">
        Subscribe once in Google Calendar, Microsoft Outlook, Apple Calendar, or Zoho Calendar —
        every future booking appears automatically; cancellations are removed on next refresh.
      </p>
      {tokenSet ? (
        <>
          <div className="rounded-lg bg-black/40 border border-zinc-800 px-3 py-2 font-mono text-xs text-zinc-300 break-all select-all">
            https://www.rotehuegels.com/api/cal/bookings.ics?token=<span className="text-rose-400">&lt;CALENDAR_SUBSCRIBE_SECRET&gt;</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            The actual token is in the CALENDAR_SUBSCRIBE_SECRET env var. Paste the complete URL
            (with the real token substituted) into your calendar app&apos;s <em>&quot;Add calendar from URL&quot;</em> option.
          </p>
        </>
      ) : (
        <p className="text-sm text-amber-400">
          Set <code className="bg-black/40 px-1">CALENDAR_SUBSCRIBE_SECRET</code> in the environment to enable the feed.
        </p>
      )}
      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs text-zinc-400">
        <p><strong className="text-zinc-300">Google:</strong> Other calendars → From URL</p>
        <p><strong className="text-zinc-300">Apple:</strong> File → New Calendar Subscription</p>
        <p><strong className="text-zinc-300">Outlook / MS 365:</strong> Add calendar → Subscribe from web</p>
        <p><strong className="text-zinc-300">Zoho:</strong> Subscribe to a calendar → by URL</p>
      </div>
    </section>
  );
}
