import Link from 'next/link';
import { FlaskConical, Activity, LineChart, ClipboardCheck, Beaker, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Bench and pilot metallurgical testwork, process modelling, techno-economic analysis, and bankable feasibility studies. Prove your process works before you commit capital.';

export const metadata = {
  title: 'Testwork & Feasibility — Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/services/testwork-feasibility' },
  openGraph: {
    title: 'Testwork & Feasibility — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/services/testwork-feasibility',
    type: 'website',
  },
};

export default function TestworkFeasibilityPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={serviceSchema({
        name: 'Testwork & Feasibility',
        description: DESCRIPTION,
        path: '/services/testwork-feasibility',
        serviceType: 'Metallurgical Testwork, Process Modelling, Feasibility Studies',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Engineering', path: '/services' },
        { name: 'Testwork & Feasibility', path: '/services/testwork-feasibility' },
      ])} />

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-24">

        {/* HERO */}
        <section className="text-center">
          <p className="text-xs tracking-widest text-emerald-400/90 uppercase mb-3">Services · Testwork &amp; Feasibility</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Prove your process works <span className="text-rose-400">before you commit capital.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            Bench-to-pilot metallurgical testwork, process simulation, mass &amp; energy balances, and bankable
            feasibility studies. We take you from ore / feed characterisation to an investor-ready DFS with
            engineering handoff package.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Book a testwork scoping call <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/success-stories" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              See completed studies
            </Link>
          </div>
        </section>

        {/* WHAT WE DELIVER */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What we deliver</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Six offerings clients buy individually or as a packaged programme.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Offering icon={Beaker} title="Bench-scale testwork"
              body="Batch and continuous trials in our lab — atmospheric / pressure leach, SX-EW rougher loadings, solvent screening, reagent optimisation. 15–500 g feed per variable. 4–8 weeks per campaign." />
            <Offering icon={FlaskConical} title="Pilot-scale integrated runs"
              body="15–200 kg integrated circuit campaigns — leach, solid-liquid separation, SX, EW / precipitation. Minimum 100-hour continuous operation to generate design data." />
            <Offering icon={Layers} title="Process modelling &amp; simulation"
              body="Rigorous unit-op modelling in HSC Chemistry, METSIM, and Aspen Plus. Kinetics, speciation, residence-time distribution, heat integration." />
            <Offering icon={Activity} title="Mass &amp; energy balance"
              body="Design-basis M&amp;E balance with full PFD and preliminary P&amp;ID set. Equipment sizing, utility loads, effluent summary, reagent schedules." />
            <Offering icon={LineChart} title="Techno-economic analysis"
              body="CAPEX (Class 3–4 AACE) and OPEX models with sensitivity on feed grade, reagent price, energy, and recovery. NPV, IRR, payback, breakeven analysis." />
            <Offering icon={ClipboardCheck} title="Bankable Feasibility Study"
              body="JORC / SAMREC / NI 43-101-aligned DFS / BFS reports for investor due diligence, debt financing, and board approval. Includes risk register and execution plan." />
          </div>
        </section>

        {/* METHODOLOGY */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Our methodology</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              A structured 4-phase approach — predictable timelines, clear decision gates.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Phase num="1" title="Scope &amp; baseline"
              body="Kickoff, feed / ore characterisation (XRD, SEM-EDS, chemical assay), literature review, test matrix design."
              duration="1–2 weeks" />
            <Phase num="2" title="Bench testwork"
              body="Parallel batch runs screening leach conditions, reagent types, kinetics. Statistical DoE where applicable."
              duration="4–8 weeks" />
            <Phase num="3" title="Pilot campaign"
              body="Integrated circuit operation. Steady-state sampling. Data reconciliation. Equipment performance validation."
              duration="4–10 weeks" />
            <Phase num="4" title="Report &amp; model"
              body="Final technical report, M&amp;E balance, PFD / P&amp;ID package, TEA, financial model, risk register. Board-ready."
              duration="3–5 weeks" />
          </div>
        </section>

        {/* DELIVERABLES */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4">What you take home</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every engagement ends with an engineering handoff package that the next phase — FEED, EPC bid,
                debt lender, or internal board — can pick up and act on without further interpretation.
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'Assay certificates (CoA) for all feed, intermediate, and product streams',
                'Process flow diagram (PFD) + preliminary P&ID set',
                'Mass &amp; energy balance (Excel-native, scenario-switchable)',
                'Equipment list with preliminary sizing + duty',
                'Process description document (what runs where, why)',
                'CAPEX estimate (Class 3–4 AACE, ±20–30% accuracy)',
                'OPEX model with reagent / energy / manpower / maintenance build-up',
                'Financial model (NPV, IRR, payback, sensitivities)',
                'Risk register with mitigation plan',
                'Final DFS / BFS report (investor-ready)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* INDUSTRIES */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Where we&apos;ve done this</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Metallurgical systems we have running testwork or feasibility programmes on.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Copper — SX-EW from oxide + sulphide concentrate',
              'Nickel — laterite (HPAL / AL) + Class I refining',
              'Battery black mass — hydromet recovery of Li / Ni / Co / Mn',
              'Rare earths — NdFeB magnet recycling + primary monazite',
              'Zinc — primary smelting + secondary dross + ash',
              'Aluminium — dross + UBC + ICW secondary alloys',
              'Lead — secondary smelting from ULAB',
              'Gold / silver — precious metal recovery from PCBs',
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to scope a testwork campaign?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            A 30-minute scoping call is enough for us to understand your feed, goals, and timeline and come back with a
            proposal in 5 working days.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Book a scoping call <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}

function Offering({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-colors">
      <Icon className="h-7 w-7 text-emerald-400 mb-3" />
      <h3 className="text-base font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-sm text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

function Phase({ num, title, body, duration }: { num: string; title: string; body: string; duration: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-widest text-emerald-400/80">STEP {num}</span>
        <span className="text-[10px] text-zinc-500 uppercase">{duration}</span>
      </div>
      <h3 className="text-base font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
