import Link from 'next/link';
import { HardHat, Cog, Package, Hammer, ClipboardList, Award, ArrowRight, CheckCircle2, Factory } from 'lucide-react';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Detailed engineering, procurement, construction, and commissioning. One accountable delivery partner from DFS to running plant.';

export const metadata = {
  title: 'Plant Engineering & EPC — Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/services/plant-epc' },
  openGraph: {
    title: 'Plant Engineering & EPC — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/services/plant-epc',
    type: 'website',
  },
};

export default function PlantEpcPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={serviceSchema({
        name: 'Plant Engineering & EPC',
        description: DESCRIPTION,
        path: '/services/plant-epc',
        serviceType: 'Engineering, Procurement, Construction, Commissioning',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Engineering', path: '/services' },
        { name: 'Plant EPC', path: '/services/plant-epc' },
      ])} />

      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <Factory className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Services · Plant Engineering &amp; EPC</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            From DFS to running plant —<br />
            <span className="text-rose-400">one accountable delivery partner.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            Detailed engineering, procurement, construction management, and commissioning under a single contract.
            We own the handoff from feasibility to steady-state operation so you don&apos;t have to coordinate four
            vendors across three continents.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/contact" className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors">
              Request a bid package <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/success-stories" className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors">
              See delivered plants
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16 space-y-24">

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What we deliver</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Full EPC scope — or any piece of it as a standalone engagement.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Offering icon={ClipboardList} title="Basic Engineering Package (BEP)"
              body="Process design basis, PFD, P&amp;ID, equipment list, preliminary layout, utility summary. Tender-ready package for FEED competitions." />
            <Offering icon={Cog} title="Detailed Engineering"
              body="Mechanical GA, isometric piping, civil &amp; structural drawings, E&amp;I schematics, control philosophy, HAZOP facilitation." />
            <Offering icon={Package} title="Procurement &amp; Vendor Development"
              body="Long-lead equipment specs, vendor shortlisting and evaluation, RFQ management, expediting, FAT witnessing, logistics coordination." />
            <Offering icon={Hammer} title="Construction Management"
              body="Site mobilisation, sub-contractor management, civil + mechanical erection, E&amp;I, QA/QC inspection plan, HSE supervision." />
            <Offering icon={HardHat} title="Commissioning &amp; Ramp-up"
              body="Pre-commissioning checks, water / air trials, feed introduction, performance-guarantee tests, and ramp to nameplate." />
            <Offering icon={Award} title="Handover &amp; Performance Guarantee"
              body="As-built drawings, O&amp;M manuals, operator training, spares list, warranty period, and performance-test reporting." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">How we execute</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">A 6-phase delivery model. Each phase has clear exit criteria before the next begins.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Phase num="1" title="Kickoff &amp; FEED review"     duration="2–4 wk" body="Design-basis lock. Risk register. Stage-gate plan." />
            <Phase num="2" title="Detailed engineering"          duration="12–20 wk" body="Full drawing package. HAZOP. Equipment MTO." />
            <Phase num="3" title="Procurement &amp; fabrication" duration="16–32 wk" body="Long-lead orders. Vendor expediting. FAT." />
            <Phase num="4" title="Site construction"             duration="20–36 wk" body="Civil, mechanical, E&amp;I, insulation, painting." />
            <Phase num="5" title="Commissioning"                 duration="6–10 wk" body="Water → feed → steady state. PG testing." />
            <Phase num="6" title="Ramp-up &amp; handover"        duration="8–12 wk" body="Operator training. Warranty. Post-handover support." />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4">Deliverables at handover</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every plant we commission ships with a complete document + drawing + training package. Nothing
                is left for you to chase after the warranty period ends.
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'Full as-built engineering package (50–500 drawings depending on scale)',
                'Equipment data sheets + O&amp;M manuals from every OEM',
                'Commissioning report with raw + processed data',
                'Performance-Guarantee test report (recovery, throughput, utilities, emissions)',
                'SOPs for every unit operation + safety procedures',
                'Operator + maintenance training records',
                'Spares list (critical + insurance + consumable)',
                '1-year warranty + 30-day post-handover on-site engineer',
                'AutoREX™ dashboard integration (optional, bundled)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Contract models</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Pick the level of accountability that matches your risk appetite.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ContractCard tier="Engineering only"
              best="You have your own procurement + construction teams"
              scope="BEP + detailed engineering + HAZOP + vendor specs" />
            <ContractCard tier="EPCM"
              best="You want to own procurement contracts but need a managing partner"
              scope="Engineering + procurement support + construction management + commissioning" />
            <ContractCard tier="Lumpsum turnkey EPC"
              best="You want a single contract, single throat to choke, fixed price, fixed date"
              scope="Engineering + procurement + construction + commissioning + performance guarantee"
              highlight />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Plants we deliver</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Copper SX-EW refining', 'Zinc dross recycling', 'Secondary lead (ULAB)',
              'Aluminium remelting + alloying', 'Black mass hydromet', 'Rare-earth separation',
              'Mineral-sands separation', 'E-waste processing lines',
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300">{item}</div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Have a DFS? Ready to build?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Share your feasibility study. We&apos;ll come back with a delivery plan, realistic schedule, and fixed-price
            EPC quote inside 3 weeks.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Request a bid package <ArrowRight className="h-4 w-4" />
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest text-emerald-400/80">STEP {num}</span>
        <span className="text-[10px] text-zinc-500">{duration}</span>
      </div>
      <h3 className="text-sm font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

function ContractCard({ tier, best, scope, highlight }: { tier: string; best: string; scope: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
      <h3 className="text-lg font-semibold mb-2">{tier}</h3>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Best when</p>
      <p className="text-sm text-zinc-300 mb-4">{best}</p>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Scope</p>
      <p className="text-sm text-zinc-400">{scope}</p>
    </div>
  );
}
