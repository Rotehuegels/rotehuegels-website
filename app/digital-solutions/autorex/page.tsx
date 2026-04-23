import Link from 'next/link';
import Image from 'next/image';
import {
  Cpu, Activity, Brain, Cog, Factory, Radio, Zap, ShieldCheck, GitBranch,
  ArrowRight, CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'AutoREX™ — Process automation & digital twin · Rotehügels',
  description:
    'AutoREX™ is the Rotehügels intelligent process-automation core — real-time SCADA/DCS/PLC ingestion, AI anomaly detection, predictive maintenance, energy optimisation, and a plant-wide digital twin that bridges OT and IT.',
};

export default function AutoRexPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-20">

        {/* Hero */}
        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl border border-red-500/30 bg-black/50 p-4">
              <Image src="/autorex-logo.jpg" alt="AutoREX" width={96} height={96} />
            </div>
          </div>
          <p className="text-xs tracking-widest text-red-400/90 uppercase mb-3">AutoREX · Core Platform</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            AutoREX™ — <span className="text-red-400">intelligent process automation</span> for industrial plants.
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            Turn plant sensors into decisions. AutoREX ingests data from your SCADA, DCS, and PLC layers,
            runs AI and rule-based control logic on top, and drives autonomous decisions — through a
            plant-wide digital twin that sits as the bridge between OT and IT.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-red-500 hover:bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Request a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/digital-solutions" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Back to the suite overview
            </Link>
          </div>
        </section>

        {/* Capability grid */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What AutoREX delivers</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Core capabilities of the process-automation platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Capability icon={Radio} title="Real-time data ingestion"
              body="OPC-UA, Modbus, MQTT, and direct tag mapping into SCADA, DCS, and PLC systems. Sensors, VFDs, weighbridges, analysers, and any field device become a live stream in the twin." />
            <Capability icon={Brain} title="AI anomaly detection"
              body="Machine-learning models trained on your plant history flag deviations before they show up as yield drops. Baselines rebuild automatically as operating regimes shift." />
            <Capability icon={Cog} title="Autonomous control loops"
              body="Combine AI recommendations with rule-based guardrails and engineer-approved set-points. AutoREX writes back safely through validated interlocks — never around them." />
            <Capability icon={Zap} title="Energy optimisation"
              body="Continuous monitoring of kWh, compressed air, steam, and fuel consumption against production. Identify energy-per-tonne anomalies and automate load-shed rules." />
            <Capability icon={ShieldCheck} title="Predictive maintenance"
              body="Equipment health scoring from vibration, current draw, temperature trends, and duty cycles. Generates condition-based work orders into your CMMS or Operon." />
            <Capability icon={GitBranch} title="Plant-wide digital twin"
              body="A live mirror of the plant — every unit operation, every flow, every interlock. Use it for operator training, commissioning simulations, and what-if analysis." />
          </div>
        </section>

        {/* Architecture */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest text-red-400/90 uppercase mb-3">OT / IT Bridge</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Sits between the field and the enterprise.</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                AutoREX is deployed as an on-prem edge layer (for plants requiring air-gapped OT) with a
                cloud control plane for multi-plant orchestration, analytics, and model training. Data
                never leaves the plant unless policy allows it — but when it does, it arrives in a form
                the business can act on.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Integrations with Operon (ERP) and LabREX (LIMS) are native — the same identity layer,
                the same audit trail, the same document store.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              {[
                'Edge node per plant — air-gap-capable, with local AI inference',
                'Cloud control plane for model training and cross-plant analytics',
                'Direct tag mapping to SCADA / DCS / PLC — no intermediate historian required',
                'Role-based access aligned with your operator / engineer / supervisor hierarchy',
                'Full audit trail — every set-point change, every model recommendation, every override',
                'API-first — integrates with your MES, CMMS, or existing historian if you have one',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Flow */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">How it works — three stages</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Stage icon={Activity} title="1. Acquire"
              body="Pull real-time signals from the plant — temperature, pressure, flow, level, current, chemistry, assays — into the digital twin." />
            <Stage icon={Brain} title="2. Reason"
              body="Run AI models and deterministic rules across the live data. Score anomalies, predict failures, and recommend corrective set-points." />
            <Stage icon={Cog} title="3. Act"
              body="Write back safely through validated interlocks. Notify operators. Trigger maintenance tickets. Log the full decision chain for audit." />
          </div>
        </section>

        {/* Industries */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Deployed across industries</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Same platform, domain-specific models.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              'Metals & mining',
              'Battery recycling',
              'Hydromet & SX–EW',
              'Water treatment',
              'Chemicals',
              'Food processing',
              'Textiles',
              'Automotive',
              'Paper & pulp',
              'Commercial facilities',
              'Minerals processing',
              'Pilot plants',
            ].map((ind, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
                <Factory className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-300">{ind}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Suite callout */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <p className="text-xs tracking-widest text-red-400/90 uppercase mb-3 text-center">Part of the AutoREX suite</p>
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">AutoREX on its own is powerful. Paired, it's transformational.</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/digital-solutions/operon" className="rounded-xl border border-zinc-800 bg-black/30 p-5 hover:border-sky-500/40 transition-colors group no-underline">
              <p className="text-[10px] uppercase tracking-widest text-sky-400/80 mb-1">Operon · ERP</p>
              <h3 className="text-base font-semibold text-white mb-1">Production data flows to accounts in real time.</h3>
              <p className="text-sm text-zinc-400">Eliminate reconciliation between the plant floor and the ledger.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-sky-400 group-hover:text-sky-300">Explore Operon <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link href="/digital-solutions/labrex" className="rounded-xl border border-zinc-800 bg-black/30 p-5 hover:border-emerald-500/40 transition-colors group no-underline">
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-1">LabREX · LIMS</p>
              <h3 className="text-base font-semibold text-white mb-1">Assay results close the loop on process control.</h3>
              <p className="text-sm text-zinc-400">Lab data drives real-time corrective set-points through AutoREX.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 group-hover:text-emerald-300">Explore LabREX <ArrowRight className="h-3 w-3" /></span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 md:p-12 text-center">
          <Cpu className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to digitise your plant?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Share a few details about your operation and current control stack. We will return a short
            deployment plan and an indicative timeline inside a week.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-red-500/40 transition-colors">
      <Icon className="h-7 w-7 text-red-400 mb-3" />
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

function Stage({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
      <Icon className="h-8 w-8 text-red-400 mx-auto mb-3" />
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
