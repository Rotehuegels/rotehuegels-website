import Link from 'next/link';
import Image from 'next/image';
import { Zap, Beaker, Settings, Factory, Award, ClipboardList, ArrowRight, CheckCircle2, Shield, Ruler } from 'lucide-react';

export const metadata = {
  title: 'Custom Anodes & Cathodes — Rotehügels',
  description: 'Precision lead anodes, aluminium cathodes, stainless-steel cathodes, titanium anodes, and copper bus-bars — custom-engineered for your electrowinning and electrorefining circuits.',
};

export default function CustomElectrodesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-24">

        <section className="text-center">
          <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">Services · Specialty Manufacturing</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Custom Anodes &amp; Cathodes — <span className="text-rose-400">engineered to your process.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            Precision electrodes fabricated to the specific feed chemistry, current density, cell geometry,
            and operating envelope of your electrowinning or electrorefining circuit. No off-the-shelf substitutes —
            every run is engineered, documented, and certified.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Request a quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Share your electrode spec
            </Link>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What we fabricate</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">A full range of electrode and cell-hardware components — each built to your drawing and spec.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Product icon={Zap} title="Lead Anodes"
              body="99.99 % purity lead anodes in Pb–Ca, Pb–Ca–Ag, and Pb–Sb alloys. Rolled or cast, dimensioned to your cell, with integrated hanger bars and copper inserts where required." />
            <Product icon={Beaker} title="Aluminium Cathodes"
              body="Starter sheets and permanent cathode blanks in high-purity aluminium. Custom thickness, surface finish, edge strips, and hook geometry to match your harvesting cycle." />
            <Product icon={Shield} title="Stainless-Steel Cathodes"
              body="316L permanent cathodes with PVC/PP edge strips. Suitable for ISA-process copper electrowinning, zinc, and nickel circuits. Consistent thickness and flatness for long cycle life." />
            <Product icon={Factory} title="Titanium Anodes"
              body="Commercial-pure titanium and MMO-coated titanium anodes. Designed for oxygen-evolving service in chloride or sulphate electrolytes, with low overpotential and extended life." />
            <Product icon={Ruler} title="Copper Bus-Bars &amp; Hangers"
              body="Cold-drawn and machined copper bus-bars, intercell bars, and hanger bars. Designed to your current rating and mechanical loading — with optional tinning or silver plating." />
            <Product icon={Award} title="Edge Strips &amp; Hardware"
              body="PVC, PP, and EPDM edge strips; insulator blocks; cell covers. Matched to your cathode dimensions and chemical environment. Supplied with every cathode run or as replacements." />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">Why custom, not off-the-shelf</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Every electrowinning circuit is different.</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Current density, electrolyte chemistry, temperature, cell pitch, harvesting interval, tank-house layout —
                each of these drives a different optimal electrode design. An electrode that works in a Chilean copper SX-EW
                tank-house will not be the right electrode for a zinc EW circuit in India or a black-mass hydromet line in Korea.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                We start every project with a process-engineering review, not a catalogue. Your electrodes come out of
                that review — matched to your plant, not retrofitted around a standard SKU.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              {[
                'Current density and cell voltage optimisation',
                'Alloy selection for cycle life vs. cost trade-off',
                'Edge strip material chosen for your electrolyte chemistry',
                'Hanger-bar geometry matched to your tank-house crane',
                'Dimensional tolerances for automated stripping machines',
                'Certified purity and traceability with every batch',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0 items-stretch">
            <div className="bg-zinc-950/60 flex items-center justify-center p-8 md:p-10">
              <Image
                src="/first-anode-zinc-chennai.png"
                alt="First lead anode fabricated in-house for the Rotehügels Zinc Dross R&D Pilot Plant, Chennai"
                width={1170}
                height={1303}
                className="w-full max-w-md h-auto object-contain"
                priority={false}
              />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">From our R&amp;D floor</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">First anode — Zinc Dross R&amp;D Pilot Plant, Chennai</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                This is the first lead anode we fabricated in-house for our Zinc Dross R&amp;D Pilot Plant in Chennai —
                cast, rolled, and fitted with an integrated copper-insert hanger bar to the cell geometry of our own
                zinc electrowinning circuit.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Every electrode we supply to customers passes through the same build discipline we apply to our own pilot
                plant — alloy selection to match the electrolyte, hanger-bar geometry matched to the tank, dimensional
                control for long cycle life, and full traceability from raw lead through to the finished anode.
              </p>
              <p className="text-xs text-zinc-500 italic">
                We do not sell what we have not built for ourselves.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0 items-stretch">
            <div className="p-8 md:p-10 flex flex-col justify-center order-2 md:order-1">
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-3">From our R&amp;D floor</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">First aluminium cathode — matched to the anode, matched to the cell</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                The companion to our first lead anode — a high-purity aluminium cathode fabricated in-house for the same
                Chennai pilot cell. Stainless-steel hanger bar with engraved branding, copper-insert contact, PVC edge
                strips, and a deposition face dimensioned to pair exactly with the anode pitch.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Anode and cathode are designed together, not separately. Hanger-bar heights, edge-strip geometry, and
                active-face dimensions are matched so the pair drops into the cell as a single engineered assembly —
                the same discipline we apply to customer orders where electrode pairs must harvest together on an
                automated stripping line.
              </p>
              <p className="text-xs text-zinc-500 italic">
                Built, tested, and run in our own tank-house before a single unit ships to a customer.
              </p>
            </div>
            <div className="bg-zinc-950/60 flex items-center justify-center p-8 md:p-10 order-1 md:order-2">
              <Image
                src="/first-aluminium-cathode-chennai.jpg"
                alt="First aluminium cathode fabricated in-house for the Rotehügels Zinc Dross R&D Pilot Plant, Chennai — paired with the first lead anode"
                width={716}
                height={1076}
                className="w-full max-w-md h-auto object-contain"
                priority={false}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">How we engineer your electrodes</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">A structured five-step process from enquiry to delivery.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Step num="1" title="Spec intake"
              body="Circuit parameters, electrolyte chemistry, cell drawings, current density, harvesting cycle, existing electrode issues." />
            <Step num="2" title="Design review"
              body="Alloy selection, dimensioning, hanger-bar geometry, edge-strip material, QC plan. Drawing issued for approval." />
            <Step num="3" title="Fabrication"
              body="Rolling / casting / machining at our partner facilities. Full material traceability and batch control." />
            <Step num="4" title="QC &amp; testing"
              body="Dimensional inspection, weight verification, purity assay, visual QC. Material Test Certificate (MTC) issued." />
            <Step num="5" title="Delivery &amp; support"
              body="Palletised, labelled, and dispatched. Installation support and post-startup tuning available on request." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Circuits we serve</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Electrodes for every common hydromet and refining application.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Copper SX–EW (sulphate)',
              'Copper electrorefining',
              'Zinc electrowinning',
              'Nickel &amp; cobalt EW',
              'Black-mass hydromet EW',
              'Silver refining (Moebius / Balbach-Thum)',
              'Gold refining (Wohlwill)',
              'PGM refining circuits',
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300"
                dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4">What ships with every order</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Electrodes arrive fully documented, tested, and ready for tank-house installation. No surprise gaps at the receiving end.
              </p>
            </div>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'Material Test Certificate (MTC) for every batch',
                'Purity assay report (XRF / wet-chemical)',
                'Dimensional inspection report',
                'Alloy composition certificate',
                'Heat-treatment / rolling records where applicable',
                'Installation drawings and handling guidelines',
                'Recommended electrolyte operating window',
                'Expected cycle-life guidance under the agreed conditions',
                'Packing list with serial numbers for traceability',
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
            <h2 className="text-2xl md:text-3xl font-bold">Engagement models</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Pick the level of support that fits your operation.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ModelCard tier="Spot order"
              best="You have an urgent replacement need or want to trial our electrodes"
              scope="One-time fabrication to your drawing. Standard QC. Ex-works delivery." />
            <ModelCard tier="Annual supply contract"
              best="You run a tank-house and want guaranteed availability with priced call-offs"
              scope="Framework agreement with agreed specs, QC plan, and call-off lead times. Volume-tiered pricing."
              highlight />
            <ModelCard tier="Integrated with Plant EPC"
              best="You are commissioning a new plant or debottlenecking an existing circuit"
              scope="Electrodes designed as part of the process engagement. Installation + tuning support bundled." />
          </div>
        </section>

        <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Have an electrode spec? Send it over.</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Share your cell drawings, current density, electrolyte chemistry, and harvesting cycle. We&apos;ll return a
            design review, material recommendation, and indicative quote inside one week.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Request a quote <ArrowRight className="h-4 w-4" />
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

function Product({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
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
      <h3 className="text-lg font-semibold mb-2">{tier}</h3>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Best when</p>
      <p className="text-sm text-zinc-300 mb-4">{best}</p>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Scope</p>
      <p className="text-sm text-zinc-400">{scope}</p>
    </div>
  );
}
