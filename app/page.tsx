// app/page.tsx
import React from "react";
import Link from "next/link";
import {
  Cpu, Monitor, Beaker, ArrowRight,
  Factory, Droplets, Zap, Wrench,
} from "lucide-react";

export const metadata = {
  title: "Rotehügels — Engineering. Technology. Execution.",
  description:
    "Rotehügels designs process plants, builds industrial software (AutoREX™, Operon, LabREX), and operates facilities across metals, mining, recycling, and process industries worldwide.",
};

export default function HomePage() {
  return (
    <div className="space-y-0">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 mb-4">
            Engineering · Technology · Execution
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-[1800px] leading-tight">
            We design plants.{" "}
            <span className="text-rose-400">Build software.</span>{" "}
            Operate facilities.
          </h1>

          <p className="mt-6 text-base md:text-lg text-zinc-400 max-w-2xl">
            From laboratory research to turnkey production — across metals, mining,
            battery recycling, and process industries worldwide.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/services" className="btn-primary no-underline">
              Explore Services
            </Link>
            <Link href="/customers/register" className="btn-ghost no-underline">
              Register as Customer
            </Link>
            <Link href="/contact" className="btn-ghost no-underline">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { value: '3 Products', sub: 'AutoREX™ · Operon · LabREX' },
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

      {/* ── TECHNOLOGY PRODUCTS ───────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 mb-2">Our Technology</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Three products. One integrated ecosystem.
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
              Each module works independently. Together, they give you complete control over your plant.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 hover:border-amber-500/40 transition-colors group">
              <Cpu className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white">AutoREX™</h3>
              <p className="text-xs text-amber-300/70 font-medium uppercase tracking-wider mt-1 mb-3">Plant Automation</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                AI-powered plant monitoring, PLC/SCADA integration, real-time production tracking,
                and predictive analytics. Your entire plant on one screen.
              </p>
              <Link href="/about#technology" className="mt-4 inline-flex items-center gap-1 text-xs text-amber-400 group-hover:text-amber-300">
                Learn more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-6 hover:border-blue-500/40 transition-colors group">
              <Monitor className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white">Operon</h3>
              <p className="text-xs text-blue-300/70 font-medium uppercase tracking-wider mt-1 mb-3">Cloud ERP</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Enterprise operations — accounting, HR, procurement, project management,
                client portal, and investor reporting. All in one platform.
              </p>
              <Link href="/about#technology" className="mt-4 inline-flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300">
                Learn more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 hover:border-emerald-500/40 transition-colors group">
              <Beaker className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white">LabREX</h3>
              <p className="text-xs text-emerald-300/70 font-medium uppercase tracking-wider mt-1 mb-3">LIMS</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Laboratory Information Management — ICP-OES, AAS, XRF, wet chemistry,
                fire assay. Sample tracking and spec compliance across all industries.
              </p>
              <Link href="/about#technology" className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-400 group-hover:text-emerald-300">
                Learn more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
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

      {/* ── THREE PILLARS ────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400 mb-2">Our Approach</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Research. Business. Consultancy.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                h: "Research",
                p: "Hydrometallurgy R&D, pilot design, process modeling, and analytical SOPs — turning lab innovation into scalable flowsheets.",
                href: "/services/research",
              },
              {
                h: "Business",
                p: "Techno-economic analysis, market intelligence, procurement collateral, and investor-ready documentation.",
                href: "/services/business",
              },
              {
                h: "Consultancy",
                p: "Plant commissioning, ramp-up support, troubleshooting, operational audits, and sustainability roadmaps.",
                href: "/services/consultancy",
              },
            ].map((c, i) => (
              <Link
                key={i}
                href={c.href}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-rose-500/30 hover:bg-rose-500/[0.03] transition-colors group no-underline"
              >
                <h3 className="font-bold text-white text-lg mb-2">{c.h}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{c.p}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-rose-400 group-hover:text-rose-300">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
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
            Whether you need a process plant, industrial automation, laboratory management,
            or a complete operations partner — we're here.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="mailto:sales@rotehuegels.com" className="btn-primary no-underline">
              Start an Engagement
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
