// app/success-stories/page.tsx
import React from "react";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";
import Section from "@/components/Section";

export const metadata = {
  title: "Success Stories — Rotehügels",
  description:
    "Rotehügels success stories: Swarna Metals Zambia — a greenfield copper project in Kitwe, Copperbelt; and a Zinc Dross Recycling plant in Chennai with zero-discharge design and AutoREX integration.",
};

export default function SuccessStoriesPage() {
  return (
    <div>
      {/* Cinematic hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <Award className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Projects Delivered</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Vision, turned<br />
            <span className="text-rose-400">into plants.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            At Rotehügels we don&rsquo;t just advise — we execute. From a greenfield copper plant
            on the Zambian Copperbelt to a zero-discharge zinc recycling facility in Chennai,
            every project is built on the same foundation: rigorous research, safe execution,
            and sustainable outcomes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <a
              href="#swarna-zambia"
              className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              See the projects <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              About Rotehügels
            </Link>
          </div>
        </div>
      </section>

      <div className="space-y-16 pb-16">

      {/* Swarna Metals Zambia */}
      <div id="swarna-zambia" className="scroll-mt-24" />
      <Section title="Swarna Metals Zambia Limited — A Greenfield Copper Project">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6">
          <p className="text-sm text-zinc-300">
            In Zambia&rsquo;s Copperbelt, Rotehügels supported process engineering and
            commissioning for{" "}
            <a
              href="https://www.swarnametals.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 hover:text-rose-300 underline"
            >
              Swarna Metals Zambia Limited
            </a>
            {" "}— a greenfield hydrometallurgical copper extraction facility operated by
            PLR Zambia Limited (part of the PLR Projects group). Construction began in
            April 2024; first commercial production was achieved in October 2025.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-2">Scope</h3>
              <p className="text-sm text-zinc-300">
                Commissioned a facility processing{" "}
                <span className="font-semibold">1,200 MT/day of ore</span> across
                two circuits.
              </p>
              <p className="text-sm text-zinc-300">
                Concentrator (crush → grind → flotation) for sulphide ore;
                leach + SX–EW for oxide and mixed ores.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-2">Innovation</h3>
              <p className="text-sm text-zinc-300">
                Flexible design for mixed sulphide–oxide ores, adaptive reagent
                schemes to handle impurities (As, Pb, Sb), and by-product
                recovery opportunities (Ag, Ni, Co).
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-2">Sustainability</h3>
              <p className="text-sm text-zinc-300">
                Onsite reservoir for water security and a
                thickener–clarifier system recycling{" "}
                <span className="font-semibold">&gt;50%</span> process water.
              </p>
              <p className="text-sm text-zinc-300">
                Circular economy built into design from day one.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-2">Output</h3>
              <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                <li>~1,000 MT/month copper concentrate</li>
                <li>~200 MT/month of 99.99% copper cathode</li>
                <li>200+ direct jobs, 2,000+ indirect beneficiaries</li>
                <li>Construction to first copper: 18 months (Apr 2024 → Oct 2025)</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Source: <a href="https://www.swarnametals.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">swarnametals.com</a> — public company disclosure.
          </p>
        </div>
      </Section>

      {/* Zinc Dross Recycling */}
      <Section title="Zinc Dross Recycling Plant — Chennai, India">
        {/* Status badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          In Progress — Commissioning Q1 2026
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6">
          <p className="text-sm text-zinc-300 max-w-[1800px]">
            Rotehügels is currently delivering a complete turnkey Zinc Dross
            Recycling facility for a confidential industrial client in Chennai,
            India — covering full layout design, civil construction, CAPEX
            equipment procurement, and the supply of custom-manufactured
            electrodes. Client identity will be disclosed upon successful
            commissioning.
          </p>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Processing Capacity", value: "300 kg/day", sub: "Zinc dross feed" },
              { label: "Zinc Feed Grade", value: "≥ 60%", sub: "Zn content in feed" },
              { label: "Project CAPEX", value: "₹2.5 Cr", sub: "End-to-end EPC" },
              { label: "Timeline", value: "6 months", sub: "Oct 2025 → Apr 2026" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-zinc-800/40 p-4 text-center">
                <p className="text-xl font-bold text-rose-400">{m.value}</p>
                <p className="text-xs font-medium text-white mt-1">{m.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-3">EPC Scope</h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li>• Complete plant layout design</li>
                <li>• Civil construction management</li>
                <li>• CAPEX equipment procurement</li>
                <li>• Process flowsheet: dross processing → electrowinning → casting</li>
                <li>• Commissioning, ramp-up & production stabilisation</li>
              </ul>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-3">Custom Electrode Supply</h3>
              <p className="text-sm text-zinc-300 mb-2">
                Rotehügels is manufacturing and supplying bespoke electrodes
                engineered to the customer's exact electrowinning process
                requirements:
              </p>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li>• <span className="text-white font-medium">99.99% purity lead anodes</span> — custom dimensions</li>
                <li>• <span className="text-white font-medium">99.99% purity aluminium cathodes</span> — custom dimensions</li>
                <li>• Designed for high-efficiency zinc electrowinning</li>
              </ul>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-3">Output Products</h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li>• <span className="text-white font-medium">Zinc cathodes</span> — high-purity electrodeposited zinc</li>
                <li>• <span className="text-white font-medium">Zinc ingots</span> — cast for direct market sale</li>
                <li>• Value recovery from a previously wasted industrial by-product</li>
              </ul>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-3">Sustainability & Compliance</h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li>• <span className="text-white font-medium">Zero liquid discharge</span> — all process water treated and recycled</li>
                <li>• All waste streams handled per <span className="text-white font-medium">PCB guidelines</span></li>
                <li>• ~109 tonnes/year of zinc dross diverted from landfill</li>
                <li>• Circular economy model — industrial waste to saleable metal</li>
              </ul>
            </div>
          </div>

          {/* Impact */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-6">
            <h3 className="font-semibold mb-3 text-rose-300">Social & Economic Impact</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              {[
                { value: "30–40", label: "Direct jobs created" },
                { value: "10×", label: "Indirect beneficiaries per direct job" },
                { value: "₹2.5 Cr", label: "Local industrial investment" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-rose-400">{s.value}</p>
                  <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AutoREX callout */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 flex gap-4 items-start">
            <div className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 tracking-wide">
              AutoREX™
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-300">Digital Integration — Complimentary</p>
              <p className="text-sm text-zinc-400 mt-1">
                Rotehügels is implementing AutoREX™ — our intelligent process
                automation platform — at this facility at no additional cost.
                AutoREX will provide real-time parameter monitoring, AI-powered
                anomaly detection, and predictive maintenance from day one of
                commissioning.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Closing */}
      <Section title="Looking Ahead">
        <p className="text-sm text-zinc-300 max-w-[1800px]">
          From a $30M greenfield copper plant in Zambia to a zero-discharge zinc
          recycling facility in Chennai — Rotehügels delivers across geographies,
          scales, and metals. Every project is built on the same foundation:{" "}
          <em>rigorous research, safe execution, and sustainable outcomes.</em>
        </p>
        <div className="mt-6 flex gap-4 flex-wrap">
          <a href="/contact" className="btn-primary no-underline">Start a conversation</a>
          <a href="/services" className="btn-ghost no-underline">Explore our services</a>
        </div>
      </Section>
      </div>
    </div>
  );
}