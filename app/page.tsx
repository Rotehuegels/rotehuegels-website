// app/page.tsx
import React from "react";
import Link from "next/link";
import {
  Cpu, ArrowRight,
  Factory, Droplets, Zap, Wrench, Wrench as HardHat, Network, CheckCircle2,
  ShieldCheck, Landmark, BadgeCheck,
} from "lucide-react";

export const metadata = {
  title: "Rotehügels — Engineering · AutoREX · Circular",
  description:
    "Three product lines under one roof: Engineering (plant EPC, electrodes, testwork, advisory), AutoREX (automation + Operon ERP + LabREX LIMS), and Circular (directory, marketplace, EPR). Research-led delivery for metals, batteries, and process industries.",
};

export default function HomePage() {
  return (
    <div className="space-y-0">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 mb-4">
            Engineering · AutoREX · Circular
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-[1800px] leading-tight">
            We design plants.{" "}
            <span className="text-rose-400">Digitise operations.</span>{" "}
            Close the loop on waste.
          </h1>

          <p className="mt-6 text-base md:text-lg text-zinc-400 max-w-2xl">
            Three product lines under one roof — engineering, an industrial software platform, and
            a circular-economy platform. From laboratory research to turnkey plants, and from plant
            data to EPR-certified material recovery.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#product-lines" className="btn-primary no-underline">
              See our product lines
            </Link>
            <Link href="/contact" className="btn-ghost no-underline">
              Start a conversation
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { value: '3 Product Lines', sub: 'Engineering · AutoREX · Circular' },
            { value: '12+ Industries', sub: 'Metals to food processing' },
            { value: 'India · Africa', sub: 'Active project regions' },
            { value: 'Since 2024', sub: 'Delivering from day one' },
          ].map((s, i) => (
            <div key={i} className="text-center md:text-left">
              <div className="text-xl md:text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────── */}
      <section className="border-b border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 py-8 lg:px-12">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 text-center mb-5">
            Verified · Registered · Operating
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white leading-snug">DPIIT Recognized Startup</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">Govt. of India · Dept. for Promotion of Industry &amp; Internal Trade</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Landmark className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white leading-snug">Incorporated in India</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug font-mono">CIN U70200TN2025PTC184573</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BadgeCheck className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white leading-snug">GSTIN verified</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug font-mono">33AAPCR0554G1ZE</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Network className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white leading-snug">1,369 facilities mapped</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">India Circular Economy Directory</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT LINES ─────────────────────────────────────────────── */}
      <section id="product-lines" className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 mb-2">Our product lines</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Three ways Rotehügels works with you.
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
              Identify which line fits your need — then click through to the offerings within it.
              Each product line stands on its own; together they cover research through operations
              through circularity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Engineering */}
            <Link href="/services" className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] p-6 md:p-7 hover:border-rose-400/50 transition-colors group no-underline flex flex-col">
              <HardHat className="h-9 w-9 text-rose-400 mb-4" />
              <p className="text-[10px] uppercase tracking-widest text-rose-400/80 font-semibold mb-1">Product Line 01</p>
              <h3 className="text-xl font-bold text-white mb-2">Engineering</h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Plant EPC, testwork &amp; feasibility, operations advisory, custom anodes &amp; cathodes,
                and severe-service valves — delivered by a single accountable partner from flowsheet to
                first pour.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 mb-4">
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-400/80 shrink-0 mt-0.5" /> Plant EPC &amp; commissioning</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-400/80 shrink-0 mt-0.5" /> Testwork &amp; feasibility</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-400/80 shrink-0 mt-0.5" /> Custom electrodes (Pb, Al, Ti, SS)</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-400/80 shrink-0 mt-0.5" /> Operations advisory</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-400/80 shrink-0 mt-0.5" /> Severe-service valves</li>
              </ul>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-rose-400 group-hover:text-rose-300">
                Explore Engineering <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* AutoREX */}
            <Link href="/digital-solutions" className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-6 md:p-7 hover:border-amber-400/50 transition-colors group no-underline flex flex-col">
              <Cpu className="h-9 w-9 text-amber-400 mb-4" />
              <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold mb-1">Product Line 02</p>
              <h3 className="text-xl font-bold text-white mb-2">AutoREX</h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Our industrial software platform. AutoREX is the automation and digital-twin core, with
                Operon (ERP) and LabREX (LIMS) as first-class modules sharing a single identity layer
                and audit trail.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 mb-4">
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" /> AutoREX™ — automation + AI + digital twin</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" /> Operon — full SaaS ERP</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" /> LabREX — multi-industry LIMS</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" /> SCADA / DCS / PLC integration</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" /> One audit trail across production, lab, accounts</li>
              </ul>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-amber-400 group-hover:text-amber-300">
                Explore AutoREX <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* Circular */}
            <Link href="/circular" className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6 md:p-7 hover:border-emerald-400/50 transition-colors group no-underline flex flex-col">
              <Network className="h-9 w-9 text-emerald-400 mb-4" />
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-semibold mb-1">Product Line 03</p>
              <h3 className="text-xl font-bold text-white mb-2">Circular</h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Our circular-economy platform. An India-wide directory of licensed recyclers, a
                marketplace matching bulk generators to recyclers by fit, and EPR / traceability
                services — built for both sides of the chain.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 mb-4">
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80 shrink-0 mt-0.5" /> India Circular Economy Directory (1,300+ facilities)</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80 shrink-0 mt-0.5" /> Generator ↔ recycler marketplace</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80 shrink-0 mt-0.5" /> EPR-fulfilment + traceability certificates</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80 shrink-0 mt-0.5" /> Pickup scheduling + chain-of-custody</li>
                <li className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/80 shrink-0 mt-0.5" /> e-waste, Li-ion, non-ferrous streams</li>
              </ul>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-emerald-400 group-hover:text-emerald-300">
                Explore Circular <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ───────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 mb-2">Industries</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Built for process industries
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Factory, name: 'Zinc' },
              { icon: Factory, name: 'Copper' },
              { icon: Factory, name: 'Gold & Silver' },
              { icon: Factory, name: 'Aluminium' },
              { icon: Zap, name: 'Battery Recycling' },
              { icon: Droplets, name: 'Water Treatment' },
              { icon: Factory, name: 'Minerals' },
              { icon: Factory, name: 'Chemicals' },
              { icon: Wrench, name: 'Textiles' },
              { icon: Wrench, name: 'Food Processing' },
              { icon: Wrench, name: 'Automotive' },
              { icon: Wrench, name: 'Paper & Pulp' },
            ].map((ind, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center hover:border-white/20 transition-colors">
                <ind.icon className="h-5 w-5 text-rose-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-zinc-300">{ind.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to work with us?
          </h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-8">
            Whether you need a plant built, a platform deployed, or a recycler matched —
            we engage at the level that fits the problem.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary no-underline">
              Start a conversation
            </Link>
            <Link href="/customers/register" className="btn-ghost no-underline">
              Register as Customer
            </Link>
            <Link href="/suppliers/register" className="btn-ghost no-underline">
              Register as Supplier
            </Link>
            <Link href="/careers" className="btn-ghost no-underline">
              Explore Careers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
