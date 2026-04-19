// app/services/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

// Note: metadata moved to layout.tsx since this is a client component

const FAQ_ITEMS = [
  {
    q: "What industries does Rotehügels work with?",
    a: "We work across the full spectrum of metals and recycling — copper (sulphide/oxide, SX-EW), nickel, cobalt, PGMs, battery black mass, rare earths (NdFeB), zinc, aluminium, lead, e-waste, and other secondary resources. If it involves extractive or recycling metallurgy, we can help.",
  },
  {
    q: "Do you work on small projects or only large-scale plants?",
    a: "Both. We have delivered a ₹2.5 Cr zinc recycling plant and a $30M greenfield copper facility. Our engagement model scales — from a bench-scale R&D study or a single troubleshooting visit, all the way to full EPC project delivery.",
  },
  {
    q: "How long does a typical engagement take?",
    a: "It depends on scope. A process audit or troubleshooting engagement can be completed in 2–4 weeks. A feasibility study typically takes 6–10 weeks. Full EPC project delivery ranges from 4 to 12 months depending on plant complexity and scale.",
  },
  {
    q: "Do you provide on-site support or only remote consulting?",
    a: "Both. We provide remote advisory, dashboards, and process monitoring. For commissioning, ramp-up, and troubleshooting, our team travels on-site — we have delivered projects in Zambia, India, and across Southeast Asia.",
  },
  {
    q: "What makes Rotehügels different from a standard engineering firm?",
    a: "We bridge the gap between laboratory science and industrial execution. Most engineering firms hand over a report — we stay through commissioning and production stabilisation. We also bring our own digital platform (AutoREX™) for process automation, which we implement alongside every major project.",
  },
  {
    q: "Can you help with regulatory compliance and environmental permits?",
    a: "Yes. All our plant designs incorporate zero liquid discharge and full compliance with PCB (Pollution Control Board) guidelines in India. We also advise on DGFT, Ministry of Mines, and BIS policy requirements relevant to your project.",
  },
  {
    q: "Do you manufacture equipment or only provide design and consulting?",
    a: "We manufacture select specialised items — such as custom 99.99% purity lead anodes and aluminium cathodes engineered to your electrowinning process requirements. For standard CAPEX equipment, we handle procurement and vendor management.",
  },
  {
    q: "How do I get started?",
    a: "The simplest way is to fill in our contact form and select 'RFP / Sales' as the inquiry type. We'll schedule a no-obligation discovery call within one business day to understand your project and outline how we can help.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white hover:text-rose-300 transition-colors"
      >
        <span>{q}</span>
        <span className={`shrink-0 text-rose-400 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm text-zinc-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function PillarCard({
  title,
  points,
}: {
  title: string;
  points: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 hover:border-zinc-700 transition-colors">
      <h3 className="text-xl font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-zinc-300 leading-relaxed text-left">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-emerald-400/80 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <section className="max-w-[1800px] mx-auto px-4 py-12 md:py-16 space-y-12 md:space-y-16">
      {/* Hero */}
      <header className="text-center">
        <p className="text-sm tracking-widest text-emerald-400/90 uppercase">
          Services
        </p>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold">
          Practical expertise across{" "}
          <span className="text-rose-400">Metals, Recycling & Strategy</span>
        </h1>
        <p className="mt-4 max-w-[1800px] mx-auto text-zinc-300">
          We combine lab-grade research, on-ground commissioning experience, and
          boardroom strategy to deliver measurable outcomes—on time and within
          budget.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600"
          >
            Book a discovery call
          </Link>
          <Link
            href="/suppliers/register"
            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
          >
            Become a supplier
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi value="1200+ TPD" label="Greenfield plant design & commissioning" />
        <Kpi value="10+ Domains" label="Metallurgy, recycling, circular economy, AI" />
        <Kpi value="Global" label="Academia, industry & policy partnerships" />
      </div>

      {/* Pillars */}
      <div className="grid gap-6 md:grid-cols-3">
        <PillarCard
          title="Research"
          points={[
            "Hydrometallurgy R&D: chalcopyrite, mixed/lean ores, black mass, NdFeB",
            "Pilot design & scale-up: bench → pilot → demo (M&E balance, PFD/PNID)",
            "Process modeling & simulation: LIX systems, kinetics, speciation, RTD",
            "Analytical methods & SOPs: AAS/AES/ICP; QA/QC",
            "Environmental & circularity: effluent treatment, reagent recycling, LCA snapshots",
          ]}
        />
        <PillarCard
          title="Business"
          points={[
            "Techno-economic analysis (OPEX/CAPEX, sensitivity, scenarios)",
            "Market entry (India focus), vendor development, policy & incentives",
            "Investor collateral: investment decks, data rooms, risk registers",
            "Procurement strategy: long-lead items, EPC/EPCM bids, Incoterms",
            "Policy & compliance watch: Ministry of Mines, DGFT, BIS",
          ]}
        />
        <PillarCard
          title="Consultancy"
          points={[
            "Commissioning & ramp-up: flotation, leach, SX–EW (design to steady-state)",
            "Troubleshooting: phase disengagement, crud, raffinate pH, hydraulics",
            "Training & SOPs: workforce upskilling, safety & risk management",
            "Audits: process health, reagent/energy efficiency, maintenance",
            "Remote dashboards: KPIs, exceptions, alerting",
          ]}
        />
      </div>

      {/* Process */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold text-center">How we engage</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-4 text-left">
          {[
            {
              t: "1) Diagnose",
              d: "Discovery call, data room review, objective/constraint mapping.",
            },
            {
              t: "2) Design",
              d: "Flowsheets, trials & pilots; TEA, risks, and implementation plan.",
            },
            {
              t: "3) Deliver",
              d: "Procurement support, on-site commissioning, ramp-up to targets.",
            },
            {
              t: "4) Sustain",
              d: "SOPs, training, dashboards, periodic audits & optimization.",
            },
          ].map((s, i) => (
            <li
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <div className="text-sm font-medium text-emerald-400/90">
                {s.t}
              </div>
              <p className="mt-1 text-sm text-zinc-300">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Industries */}
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-semibold">Industries we serve</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-left">
          {[
            "Copper (sulphide/oxide, SX–EW)",
            "Nickel, cobalt, PGM streams",
            "Battery recycling (black mass)",
            "Rare earths (NdFeB, separation)",
            "Zinc dross & secondary zinc",
            "Aluminium & lead recycling",
            "E-waste & secondary resources",
          ].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300"
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-6">
          Frequently asked questions
        </h2>
        <div className="max-w-[1800px] mx-auto divide-y divide-zinc-800">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t see your question?{" "}
          <Link href="/contact" className="text-rose-400 hover:underline">
            Ask us directly
          </Link>
        </p>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 to-zinc-900/20 p-6 md:p-8 text-center">
        <h2 className="text-xl md:text-2xl font-semibold">
          Ready to move from slides to results?
        </h2>
        <p className="mt-2 max-w-[1800px] mx-auto text-zinc-300">
          Whether it’s de-bottlenecking, a pilot to prove recovery, or a
          greenfield ramp-up—our team integrates science, operations, and
          strategy to deliver outcomes.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Talk to an expert
          </Link>
          <Link
            href="/suppliers/register"
            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
          >
            Become a supplier
          </Link>
        </div>
      </div>
    </section>
  );
}