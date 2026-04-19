import Link from 'next/link';
import { Gauge, Factory, Settings, Shield, Award, ArrowRight, CheckCircle2, Activity, Zap, Flame } from 'lucide-react';

export const metadata = {
  title: 'Severe Service Control Valve Packages — Rotehügels',
  description: 'Engineered severe-service control valve packages for process plants across oil & gas, petrochemicals, power, chemicals, fertilisers, metals & mining, pulp & paper, and more — anti-cavitation, anti-surge, high-dP, sour-service, cryogenic, and erosive applications. Fully integrated with actuator, positioner, and instrumentation.',
};

export default function SevereServiceValvesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-24">

        <section className="text-center">
          <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">Services · Specialty Engineering</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Severe Service Control Valve Packages — <span className="text-rose-400">engineered for any process plant.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            Fully engineered control-valve packages for the hardest service across oil &amp; gas, petrochemicals,
            power, chemicals, fertilisers, metals &amp; mining, pulp &amp; paper, and every other process industry —
            anti-cavitation, anti-surge, high pressure-drop, sour-service, cryogenic, and erosive duty. Sized,
            selected, packaged, and certified to the standards your EPC and operator will accept without argument.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Request a valve package <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Share your valve datasheet
            </Link>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What&apos;s in the package</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Every package is a complete, shop-assembled, tested, and certified system — not just a valve body.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Item icon={Gauge} title="Severe-Service Valve Body &amp; Trim"
              body="Globe, angle, axial-flow, or rotary body as selected. Multi-stage anti-cavitation, drag, labyrinth, or characterised trim engineered to the dP profile." />
            <Item icon={Settings} title="Actuator"
              body="Pneumatic diaphragm, piston, scotch-yoke, or electro-hydraulic — sized for fail-safe action, stroke speed, and Cv signature. Spring-return where required." />
            <Item icon={Activity} title="Smart Positioner &amp; Comms"
              body="HART, FOUNDATION Fieldbus, PROFIBUS PA, or WirelessHART digital positioner. Diagnostics, partial-stroke test, and asset-management integration." />
            <Item icon={Shield} title="Safety &amp; Interlock Hardware"
              body="Solenoid valves (SIL-rated), air-lock relays, quick-exhaust valves, limit switches, lock-up valves, and partial-stroke-test controllers for SIS duty." />
            <Item icon={Flame} title="Noise &amp; Vibration Control"
              body="Inline diffusers, vent silencers, downstream flow straighteners, acoustic insulation, and pipe-wall thickness recommendations for hydraulic/aerodynamic noise compliance." />
            <Item icon={Zap} title="Air Prep &amp; Accessories"
              body="Filter-regulators, volume boosters, air tanks for fail-action, tubing, fittings, mounting hardware, nameplates — everything you need for turnkey installation." />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">Severe service we specialise in</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">The conditions that kill standard valves.</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Most control-valve failures in oil &amp; gas plants trace back to wrong trim selection, undersized
                actuator, or noise / erosion limits breached. Our engineering review catches these before the valve
                is cut — not after a trim is wrecked in the first six months.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Every package is backed by a sizing and selection report, trim-exit velocity calculation, noise
                prediction per IEC 60534-8-3/4, and a valve-life expectation under your actual service conditions.
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'High pressure-drop letdown &mdash; cavitation &amp; flashing control',
                'Compressor anti-surge &mdash; fast stroke, high rangeability',
                'Wellhead choke service &mdash; erosive &amp; multiphase',
                'Sour-service NACE MR0175 duty',
                'Cryogenic (LNG, ethylene, ammonia) applications',
                'Coker, hydrocracker, FCC slurry, SRU duty',
                'Steam conditioning &amp; desuperheating',
                'High-temperature HP steam &amp; reheat service',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Our engineering approach</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">A six-step process from your datasheet to a tested, certified, shipped package.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Step num="1" title="Process review"     body="Datasheet ingestion, P&amp;ID review, upstream / downstream line-size validation." />
            <Step num="2" title="Sizing &amp; trim selection"     body="IEC 60534 sizing, cavitation index, FL, xT, noise prediction, erosion check." />
            <Step num="3" title="Package design"     body="Actuator sizing, positioner specs, SIL architecture, accessory BoM, GA drawings." />
            <Step num="4" title="Fabrication"        body="Body casting / forging, trim machining, NDT, PMI. Full MTC traceability." />
            <Step num="5" title="FAT &amp; certification"      body="Hydro / pneumatic / functional / SIL PST / noise. Witness by client or TPI as required." />
            <Step num="6" title="Delivery &amp; commissioning"  body="Packaged, tagged, shipped. Site supervision, loop check, and tuning support." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Industries &amp; applications we serve</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Every process plant has its hard services. Here are the ones we regularly engineer packages for.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'Oil &amp; Gas upstream — wellhead choke, separator letdown',
              'Oil &amp; Gas midstream — compressor anti-surge, pipeline pressure control',
              'LNG — cryogenic feed, BOG, end-flash',
              'Refining — coker, FCC, hydrocracker, reformer',
              'Petrochemicals — ethylene, ammonia, methanol, aromatics',
              'Fertilisers — urea letdown, ammonia condenser, CO<sub>2</sub> stripping',
              'Power — HP/IP/LP steam, BFW, condensate, cooling',
              'Chemicals — chlor-alkali, acids, solvents, batch reactors',
              'Metals &amp; Mining — hydromet, SX-EW, autoclaves, slurry',
              'Pulp &amp; Paper — digester, recovery boiler, bleach plant',
              'Pharmaceuticals — sterile steam, WFI, CIP/SIP',
              'Food &amp; Beverage — sanitary service, process steam',
              'Water &amp; Wastewater — high-pressure RO, sludge transfer',
              'Cement — preheater, clinker cooler, waste-heat recovery',
              'Steel — BF/BOF gas, pickling, galvanising, CGL',
              'District Heating / Cooling — HP letdown, flash tanks',
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300"
                dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4">Standards &amp; certifications</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every package is built to — and documented against — the standards your EPC and operator require.
                No arguments about compliance at the document-review stage.
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'ISA S75.01 / IEC 60534 &mdash; sizing, flow, and noise',
                'ASME B16.34 &mdash; pressure-temperature rating',
                'API 6D, 598, 607, 6FA &mdash; testing &amp; fire-safe',
                'NACE MR0175 / ISO 15156 &mdash; sour service',
                'IEC 61508 / 61511 &mdash; SIL certification for SIS duty',
                'ATEX / IECEx &mdash; hazardous-area instrumentation',
                'PED 2014/68/EU &amp; CE marking where applicable',
                'EN 10204 3.1 / 3.2 material test certificates',
                'TPI witness inspection (Lloyd&rsquo;s, BV, DNV, TÜV)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Engagement models</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">From one-off packages to framework supply for EPC projects.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ModelCard tier="Single-valve package"
              best="You have one critical service you need to get right — e.g. a high-dP letdown or a compressor anti-surge valve"
              scope="Full engineering, valve + actuator + instrumentation, FAT, certification, shipped ready to install." />
            <ModelCard tier="EPC project supply"
              best="You are building or revamping a process unit and need the full valve package under one contract"
              scope="All control valves across the unit — common documentation, unified instrumentation standard, coordinated FAT, consolidated shipment."
              highlight />
            <ModelCard tier="Plant-wide retrofit &amp; upgrade"
              best="You have chronic valve failures in specific services and want a single partner to review, replace, and document"
              scope="Audit of problem services, trim / body redesign, phased replacement, installation supervision, documentation refresh." />
          </div>
        </section>

        <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Have a valve that keeps failing?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Share the process datasheet, the failure mode, and a few photos. We&apos;ll come back with a root-cause
            read, a redesigned package spec, and an indicative quote inside two weeks.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Request a valve package <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services/plant-epc" className="inline-flex items-center rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              See our Plant EPC capabilities
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

function Item({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-rose-500/40 transition-colors">
      <Icon className="h-7 w-7 text-rose-400 mb-3" />
      <h3 className="text-base font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-sm text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <span className="text-xs font-bold tracking-widest text-rose-400/80">STEP {num}</span>
      <h3 className="text-sm font-semibold mt-2 mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

function ModelCard({ tier, best, scope, highlight }: { tier: string; best: string; scope: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? 'border-rose-500/40 bg-rose-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
      <h3 className="text-lg font-semibold mb-2" dangerouslySetInnerHTML={{ __html: tier }} />
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Best when</p>
      <p className="text-sm text-zinc-300 mb-4">{best}</p>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Scope</p>
      <p className="text-sm text-zinc-400">{scope}</p>
    </div>
  );
}
