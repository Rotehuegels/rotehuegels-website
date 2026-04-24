import Link from 'next/link';
import {
  Recycle, Network, ShoppingBag, FileCheck2, MapPin, ArrowRight,
} from 'lucide-react';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DESCRIPTION = 'Rotehügels Circular — the India Circular Economy Directory, generator-to-recycler marketplace, and EPR traceability services. Connecting bulk generators of e-waste, spent Li-ion, and non-ferrous scrap with licensed recyclers.';

export const metadata = {
  title: 'Circular — Directory · Marketplace · EPR · Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/circular' },
  openGraph: {
    title: 'Circular — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/circular',
    type: 'website',
  },
};

// Refresh the directory count hourly; keeps the hub in step with the DB.
export const revalidate = 3600;

async function getDirectoryCount(): Promise<number | null> {
  try {
    const { count } = await supabaseAdmin
      .from('recyclers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    return count ?? null;
  } catch {
    return null;
  }
}

export default async function CircularHubPage() {
  const facilityCount = await getDirectoryCount();
  const facilityCountLabel = facilityCount != null
    ? `${facilityCount.toLocaleString('en-IN')}+`
    : '1,300+';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={serviceSchema({
        name: 'Rotehügels Circular',
        description: DESCRIPTION,
        path: '/circular',
        serviceType: 'Circular Economy Platform, EPR Fulfilment, Recycler Directory, Marketplace',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Circular', path: '/circular' },
      ])} />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <Recycle className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Rotehügels Circular · Platform</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Connecting generators<br />
            <span className="text-rose-400">with licensed recyclers.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            A directory, a marketplace, and a compliance layer — built to move e-waste, spent Li-ion
            batteries, and non-ferrous scrap from where it is generated to a recycler with the right
            licence, capacity, and geography.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/ecosystem"
              className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Explore the directory <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/book/circular-platform-intro"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              Book a 30-min intro
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16 space-y-20">

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Two live pillars — one more in the works</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Together they cover the full lifecycle from discovery through to EPR-certified closure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/ecosystem" className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-rose-500/40 transition-colors group no-underline">
              <Network className="h-7 w-7 text-rose-400 mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-rose-400/80 mb-1">Directory</p>
              <h3 className="text-lg font-semibold mb-2">India Circular Economy Directory</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                {facilityCountLabel} verified facilities mapped across primary producers, EV OEMs, battery pack makers,
                and licensed recyclers. Filter by material stream, geography, licence class, and capacity —
                then verify credentials in one click.
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-rose-400 group-hover:text-rose-300">
                Browse the directory <ArrowRight className="h-3 w-3" />
              </span>
            </Link>

            <Link href="/recycling" className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-rose-500/40 transition-colors group no-underline">
              <FileCheck2 className="h-7 w-7 text-rose-400 mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-rose-400/80 mb-1">Compliance</p>
              <h3 className="text-lg font-semibold mb-2">EPR, Traceability & Pickups</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Pickup scheduling, transporter coordination, weighbridge and chain-of-custody capture at
                every handover — with an EPR-fulfilment certificate issued on closure. Designed for
                generators, brand owners, and obligation holders.
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-rose-400 group-hover:text-rose-300">
                Start a pickup request <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          {/* Marketplace teaser — not yet live */}
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-amber-300 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">Marketplace</p>
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold">Coming 2026</span>
                </div>
                <p className="text-sm text-zinc-300 mt-0.5">
                  Generator ↔ recycler lot matching by licence class, capacity headroom, material capability, and geography.
                </p>
              </div>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 no-underline shrink-0">
              Request early access <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Built for both sides of the chain</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Who Rotehügels Circular is for.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                t: 'Generators',
                body: 'Factories, OEMs, institutional producers, and licensed collection agencies moving bulk e-waste, spent Li-ion, or non-ferrous scrap — looking for a verified recycler with EPR credits baked in.',
              },
              {
                t: 'Recyclers',
                body: 'CPCB- and SPCB-authorised recyclers and processors looking for a steady, verified, compliance-clean feedstock pipeline outside broker networks.',
              },
              {
                t: 'Brand owners & obligation holders',
                body: 'Producers with EPR targets who need a transparent, auditable chain from generator through to certificate — across multiple recyclers if needed.',
              },
            ].map((it, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <p className="text-[11px] uppercase tracking-widest text-rose-400/80 mb-2">Audience</p>
                <h3 className="text-base font-semibold mb-2">{it.t}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{it.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Pick a starting point</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Browse the directory to find licensed recyclers, or post a pickup request and we&apos;ll match you with the right facility.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/ecosystem" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
              <MapPin className="h-4 w-4" /> Browse the directory
            </Link>
            <Link href="/recycling/request" className="inline-flex items-center rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Post a pickup request <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
