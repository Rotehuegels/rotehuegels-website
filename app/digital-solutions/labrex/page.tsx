import Link from 'next/link';
import {
  FlaskConical, Microscope, ClipboardCheck, BarChart3, QrCode, GitBranch,
  ShieldCheck, ArrowRight, CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'LabREX — LIMS for process industries · Rotehügels',
  description:
    'LabREX is Rotehügels\' multi-industry LIMS — sample intake, instrument integration (ICP-OES, AAS, wet-chem, furnace), certificate-of-analysis generation, and assay trend analytics. Results auto-sync to AutoREX to drive process-correction decisions in real time.',
};

export default function LabRexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-20">

        {/* Hero */}
        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-black/50 p-4">
              <FlaskConical className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <p className="text-xs tracking-widest text-emerald-400/90 uppercase mb-3">AutoREX Suite · Lab &amp; QA</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            LabREX — <span className="text-emerald-400">the LIMS that closes the loop on process control.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            A multi-industry Laboratory Information Management System covering sample intake, instrument
            integration, CoA generation, and assay trend analytics. Built for metals, battery-recycling,
            and process-chemistry labs — and designed to feed its results back into AutoREX so the plant
            corrects itself.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Request a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/digital-solutions" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Back to the suite overview
            </Link>
          </div>
        </section>

        {/* Capabilities */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What LabREX covers</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              End-to-end lab lifecycle — intake to certificate to plant feedback.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Capability icon={QrCode} title="Sample intake & chain of custody"
              body="Barcoded samples with full chain of custody — from field collection or plant sampling point through to final CoA. Every handover is logged and traceable." />
            <Capability icon={Microscope} title="Instrument integration"
              body="ICP-OES, AAS, XRF, titrators, furnaces, fire-assay rigs, pH / conductivity meters. Direct integration so instrument results write back automatically — no double entry." />
            <Capability icon={ClipboardCheck} title="Method library"
              body="Pre-built methods for Cu, Au, Ag, Zn, black mass, Al, Ni, Co, Pb, and more. Custom methods captured once and reused across samples with full parameter control." />
            <Capability icon={ShieldCheck} title="QA / QC workflows"
              body="Duplicates, standards, blanks, and recovery checks baked into every run. Out-of-spec results trigger automatic re-runs and analyst sign-off." />
            <Capability icon={BarChart3} title="CoA &amp; reports"
              body="Auto-generated certificates of analysis, method validation reports, ISO 17025 documentation, and management summaries. Branded, signed, and audit-logged." />
            <Capability icon={GitBranch} title="Closed-loop to AutoREX"
              body="When a sample is out of spec, LabREX notifies AutoREX — which can pause the downstream step, adjust a set-point, or flag an operator, all before the next tonne is produced." />
          </div>
        </section>

        {/* Industry methods */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest text-emerald-400/90 uppercase mb-3">Industry coverage</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Methods ready for your industry, day one.</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                LabREX ships with validated method libraries for the industries we serve — non-ferrous
                metals, battery black-mass refining, precious-metals refining, and general process chemistry.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Custom methods and matrices can be added at any point — including your own IP around
                sample prep, reagent scheme, and calibration. Every method carries its own audit trail
                so you can prove compliance on demand.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              {[
                'Copper — ICP-OES, AAS, electrogravimetric',
                'Gold & silver — fire assay, AAS, Wohlwill / Moebius refining controls',
                'Zinc — ICP-OES, AAS, zinc dross chemistry',
                'Battery black mass — Li, Ni, Co, Mn full suite',
                'Aluminium — ICP, optical emission',
                'Wet chemistry — titrations, gravimetric, pH / conductivity',
                'Furnace methods — moisture, LOI, ash',
                'ISO 17025 documentation out of the box',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Flow */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">From sample to plant correction — one path</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <Step num="1" title="Receive"
              body="Sample registered with barcode, source location, sampling point, and method selection." />
            <Step num="2" title="Analyse"
              body="Instrument runs the method; results write back automatically. QC checks auto-fire." />
            <Step num="3" title="Review"
              body="Analyst reviews, approves, or triggers re-run. Full audit trail captured." />
            <Step num="4" title="Act"
              body="Results feed AutoREX — which can pause, correct, or approve the next process step." />
          </div>
        </section>

        {/* Suite callout */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <p className="text-xs tracking-widest text-emerald-400/90 uppercase mb-3 text-center">Part of the AutoREX suite</p>
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">LabREX is precise. Connected, it prevents yield loss.</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/digital-solutions/autorex" className="rounded-xl border border-zinc-800 bg-black/30 p-5 hover:border-red-500/40 transition-colors group no-underline">
              <p className="text-[10px] uppercase tracking-widest text-red-400/80 mb-1">AutoREX · Process Automation</p>
              <h3 className="text-base font-semibold text-white mb-1">Every assay drives a plant decision.</h3>
              <p className="text-sm text-zinc-400">Out-of-spec samples automatically adjust downstream set-points through AutoREX.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-red-400 group-hover:text-red-300">Explore AutoREX <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link href="/digital-solutions/operon" className="rounded-xl border border-zinc-800 bg-black/30 p-5 hover:border-sky-500/40 transition-colors group no-underline">
              <p className="text-[10px] uppercase tracking-widest text-sky-400/80 mb-1">Operon · ERP</p>
              <h3 className="text-base font-semibold text-white mb-1">QA tickets gate dispatch.</h3>
              <p className="text-sm text-zinc-400">Batches that fail LabREX QC cannot be invoiced from Operon until cleared.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-sky-400 group-hover:text-sky-300">Explore Operon <ArrowRight className="h-3 w-3" /></span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <FlaskConical className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Digitise your lab.</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Tell us your instrument inventory, sample volume, and industry. We will return a deployment
            scope with pre-validated methods for your analytes inside a week.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Request a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/digital-solutions" className="inline-flex items-center rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              See the full AutoREX suite
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

function Capability({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-emerald-500/40 transition-colors">
      <Icon className="h-7 w-7 text-emerald-400 mb-3" />
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <span className="text-xs font-bold tracking-widest text-emerald-400/80">STEP {num}</span>
      <h3 className="text-sm font-semibold mt-2 mb-2">{title}</h3>
      <p className="text-xs text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
