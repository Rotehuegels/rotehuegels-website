// app/success-stories/page.tsx
import React from "react";
import Section from "@/components/Section";

export const metadata = {
  title: "Success Stories — Rotehügels",
  description:
    "Flagship success story: Swarna Metals Zambia Limited — a $30M greenfield hydrometallurgical copper project designed and commissioned with sustainability at its core.",
};

export default function SuccessStoriesPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <Section
        title="Success Stories"
        subtitle="Turning vision into reality — global projects, sustainable impact."
      >
        <p className="text-lg text-zinc-300 max-w-3xl">
          At Rotehügels, we don’t just advise — we execute. Our projects span
          research pilots, feasibility studies, and full-scale plants. Here’s
          one of our flagship success stories.
        </p>
      </Section>

      {/* Swarna Metals Zambia */}
      <Section title="Swarna Metals Zambia Limited — A Greenfield Copper Project">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-6">
          <p className="text-sm text-zinc-300">
            In Zambia’s Copperbelt, Rotehügels supported the design and
            commissioning of a <span className="font-semibold">$30M</span>{" "}
            greenfield hydrometallurgical copper plant — a first-of-its-kind
            model blending sustainability with production scale.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-2">Scope</h3>
              <p className="text-sm text-zinc-300">
                Commissioned a facility processing{" "}
                <span className="font-semibold">1,200 MT/day of ore</span>.
              </p>
              <p className="text-sm text-zinc-300">
                Two-stage flowsheet: flotation → concentrate; leach + SX–EW →
                cathode.
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
                <span className="font-semibold">&gt;50% process water</span>.
              </p>
              <p className="text-sm text-zinc-300">
                Circular economy built into design from day one.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800/40 p-6">
              <h3 className="font-semibold mb-2">Impact</h3>
              <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                <li>~40 MT/day concentrate @ 25% Cu</li>
                <li>~10 MT/day copper cathode</li>
                <li>200+ direct jobs, 2,000+ indirect beneficiaries</li>
                <li>Commissioned in just 7 months</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Closing */}
      <Section title="Looking Ahead">
        <p className="text-sm text-zinc-300 max-w-3xl">
          Swarna Metals Zambia stands as proof of how Rotehügels bridges{" "}
          <em>research, execution, and sustainability</em>. From here, we
          continue to scale new greenfield projects, recycling initiatives, and
          digital-first platforms worldwide.
        </p>
      </Section>
    </div>
  );
}