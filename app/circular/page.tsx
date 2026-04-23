import Link from 'next/link';
import {
  Recycle, Network, ShoppingBag, FileCheck2, MapPin, ArrowRight, CheckCircle2,
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

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-20">

        <section className="text-center">
          <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">Product Line · Circular Economy</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Rotehügels Circular — <span className="text-rose-400">connecting generators with licensed recyclers.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            A directory, a marketplace, and a compliance layer — built to move e-waste, spent Li-ion
            batteries, and non-ferrous scrap from where it is generated to a recycler with the right
            licence, capacity, and geography.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/ecosystem" className="rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Explore the directory <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Talk to our team
            </Link>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Three parts, one circular platform</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Each component stands on its own — together they cover the full lifecycle from discovery through to EPR-certified closure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
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

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 relative">
              <ShoppingBag className="h-7 w-7 text-zinc-500 mb-3" />
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Marketplace</p>
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold">Coming soon</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-300">Generator ↔ Recycler Marketplace</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Bulk generators post e-waste, spent Li-ion, and non-ferrous scrap. The platform matches
                each lot against recyclers whose licence class, capacity headroom, material capability,
                and geography fit the requirement.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 no-underline">
                Request early access <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <Link href="/recycling" className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-rose-500/40 transition-colors group no-underline">
              <FileCheck2 className="h-7 w-7 text-rose-400 mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-rose-400/80 mb-1">Compliance</p>
              <h3 className="text-lg font-semibold mb-2">EPR, Traceability &amp; Pickups</h3>
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
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">How it works</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">From discovery to EPR closure — one continuous flow.</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Bulk generators post available stock — material stream, quantity, location, and condition.
                The platform matches the lot against licensed recyclers whose licence class, capacity
                headroom, material capability, and operational geography fit the requirement.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Matched recyclers confirm availability and terms. Pickup scheduling, transporter
                coordination, and chain-of-custody capture happen inside the platform — with a
                traceable EPR-fulfilment certificate generated at closure.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              {[
                'Licence-class verification against CPCB / SPCB registries',
                'Capacity headroom, material capability, and geographic fit built into the match',
                'Transporter and weighbridge integration at every handover',
                'Chain-of-custody data captured end to end',
                'EPR-fulfilment certificate issued on closure',
                'Generator, recycler, and brand-owner views in one workspace',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
                t: 'Brand owners &amp; obligation holders',
                body: 'Producers with EPR targets who need a transparent, auditable chain from generator through to certificate — across multiple recyclers if needed.',
              },
            ].map((it, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <p className="text-[11px] uppercase tracking-widest text-rose-400/80 mb-2">Audience</p>
                <h3 className="text-base font-semibold mb-2">{it.t}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: it.body }} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to join — or to post your first lot?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Recyclers can register, add their facility, and opt in to marketplace participation.
            Generators can post a lot and receive matched offers from licensed recyclers in their geography.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/recycling/recycler-register" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Register as a recycler <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/recycling/request" className="inline-flex items-center rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Post a pickup request
            </Link>
            <Link href="/ecosystem" className="inline-flex items-center rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              <MapPin className="h-4 w-4 mr-1.5" /> Browse the directory
            </Link>
            <Link href="/contact" className="inline-flex items-center rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-6 py-3 text-sm font-medium text-amber-200 transition-colors">
              Request marketplace early access
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
