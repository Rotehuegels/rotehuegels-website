// app/services/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Services — Rotehügels",
  description:
    "Research, Business, and Consultancy services across extractive metallurgy, critical minerals, and circular economy.",
};

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
    <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-12 md:space-y-16">
      {/* Hero */}
      <header className="text-center">
        <p className="text-sm tracking-widest text-emerald-400/90 uppercase">
          Services
        </p>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold">
          Practical expertise across{" "}
          <span className="text-rose-400">Metals, Recycling & Strategy</span>
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-zinc-300">
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
            href="/success-stories"
            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
          >
            View success stories
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

      {/* CTA */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/40 to-zinc-900/20 p-6 md:p-8 text-center">
        <h2 className="text-xl md:text-2xl font-semibold">
          Ready to move from slides to results?
        </h2>
        <p className="mt-2 max-w-3xl mx-auto text-zinc-300">
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
            href="/suppliers"
            className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-600"
          >
            Become a supplier
          </Link>
        </div>
      </div>
    </section>
  );
}