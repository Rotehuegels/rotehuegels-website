import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Clock, ArrowLeft } from 'lucide-react';
import { getEventTypeBySlug, generateSlots, listEventTypes } from '@/lib/bookings';
import BookingPicker from './BookingPicker';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const et = await getEventTypeBySlug(slug);
  if (!et) return { title: 'Book a call — Rotehügels', robots: { index: false, follow: false } };
  return {
    title: `Book: ${et.name} — Rotehügels`,
    description: et.description ?? undefined,
    alternates: { canonical: `/book/${et.slug}` },
    openGraph: {
      title: `Book: ${et.name} — Rotehügels`,
      description: et.description ?? undefined,
      url: `https://www.rotehuegels.com/book/${et.slug}`,
      type: 'website',
    },
  };
}

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const eventType = await getEventTypeBySlug(slug);
  if (!eventType) notFound();

  const slots = await generateSlots(eventType);
  const otherEventTypes = (await listEventTypes()).filter(e => e.slug !== eventType.slug);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-12 md:py-16">

        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-8 no-underline">
          <ArrowLeft className="h-3 w-3" /> Back to Rotehügels
        </Link>

        <div className="grid lg:grid-cols-[360px_1fr] gap-10">
          {/* Left — event context */}
          <aside className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-2">Book a call</p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">{eventType.name}</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span>{eventType.duration_minutes} minutes · {eventType.host_name}</span>
              </div>
              {eventType.description && (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{eventType.description}</p>
              )}
            </div>

            {otherEventTypes.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Other sessions</p>
                <ul className="space-y-2">
                  {otherEventTypes.map(e => (
                    <li key={e.slug}>
                      <Link href={`/book/${e.slug}`} className="block text-sm text-zinc-300 hover:text-white no-underline">
                        {e.name} <span className="text-xs text-zinc-500">· {e.duration_minutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-zinc-500 leading-relaxed">
              Times below are shown in your browser&apos;s timezone. The call happens in {eventType.host_name}&apos;s local time: {eventType.timezone}.
            </div>
          </aside>

          {/* Right — slot picker */}
          <BookingPicker
            eventType={{
              id: eventType.id,
              slug: eventType.slug,
              name: eventType.name,
              duration_minutes: eventType.duration_minutes,
              timezone: eventType.timezone,
              host_name: eventType.host_name,
            }}
            initialSlots={slots}
          />
        </div>
      </div>
    </div>
  );
}
