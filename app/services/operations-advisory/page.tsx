import Link from 'next/link';
import { Gauge, Wrench, TrendingUp, GraduationCap, BookOpen, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Process audits, debottlenecking, SOPs, remote monitoring, and compliance watch for running plants. Ramp up faster, recover more, spend less.';

export const metadata = {
  title: 'Operations Advisory — Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/services/operations-advisory' },
  openGraph: {
    title: 'Operations Advisory — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/services/operations-advisory',
    type: 'website',
  },
};

export default function OperationsAdvisoryPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={serviceSchema({
        name: 'Operations Advisory',
        description: DESCRIPTION,
        path: '/services/operations-advisory',
        serviceType: 'Plant Operations Advisory, Audits, Debottlenecking',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Engineering', path: '/services' },
        { name: 'Operations Advisory', path: '/services/operations-advisory' },
      ])} />

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-24">

        <section className="text-center">
          <p className="text-xs tracking-widest text-emerald-400/90 uppercase mb-3">Services · Operations Advisory</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Ramp up faster. Recover more. <span className="text-rose-400">Spend less.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            Process audits, debottlenecking programmes, SOP overhauls, remote monitoring, and compliance watch for
            running plants. Every engagement is tied to a quantified ₹ / kg / hour / MWh outcome — we measure the
            impact in the same currency as the P&amp;L.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Book a plant audit <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/digital-solutions" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Explore AutoREX™
            </Link>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What we deliver</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Seven engagement types — buy one, bundle several, or retain us as a fractional metallurgist.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Offering icon={Gauge} title="Process audit"
              body="Single-visit or ongoing. Plant walkthrough, mass-balance reconciliation, actual-vs-design gap analysis, opportunity register with quantified ₹ impact." />
            <Offering icon={TrendingUp} title="Yield &amp; recovery optimisation"
              body="Root-cause analysis of recovery losses (reagent, residence time, entrainment, circulating loads). Test-plan to close gap between actual and design recovery." />
            <Offering icon={Wrench} title="Debottlenecking"
              body="Identify and resolve hydraulic, chemical, mechanical, or control-system bottlenecks. Typical clients see 15–40% throughput uplift without capital expansion." />
            <Offering icon={BookOpen} title="SOP development &amp; training"
              body="Unit-operation SOPs, startup / shutdown / emergency procedures, shift handover protocols. Classroom + on-the-job operator training with competency sign-off." />
            <Offering icon={Radio} title="Remote monitoring dashboards"
              body="Deploy AutoREX™ tags + dashboards for KPIs, exceptions, and predictive alerts. We can run the dashboards on your behalf as a managed service." />
            <Offering icon={GraduationCap} title="Compliance &amp; regulatory watch"
              body="CPCB / SPCB / DGFT / BIS updates, EPR registration support, consent-to-operate renewals, emission / effluent compliance reviews. Monthly briefing." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">How an engagement runs</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Typical audit-to-implementation cycle. Retainers compress this into an ongoing cadence.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Phase num="1" title="Day-1 diagnostic"  duration="1 day on-site"
              body="Plant walkthrough, data-room access, operator interviews, initial hypotheses." />
            <Phase num="2" title="Gap analysis"       duration="1–2 weeks"
              body="Benchmark actual vs design, quantify every loss stream, build prioritised opportunity register." />
            <Phase num="3" title="Deep-dive testing"  duration="2–4 weeks"
              body="In-situ trials, lab testwork on plant samples, root-cause validation, recommendation package." />
            <Phase num="4" title="Implementation"     duration="4–12 weeks"
              body="On-site support during changes, SOP updates, operator coaching, result validation, financial impact measurement." />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h3 className="text-lg font-bold mb-4">Deliverables you keep</h3>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'Diagnostic report — findings + prioritised recommendations',
                'Financial impact model (₹ saved / earned per recommendation)',
                'Updated SOPs + operator checklists',
                'Training curriculum + competency assessments',
                'Dashboard setup (KPIs, exceptions, alerting rules)',
                'Quarterly compliance snapshot (for retainer clients)',
                'Quarterly benchmark vs industry peer set',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <h3 className="text-lg font-bold mb-4">Typical outcomes</h3>
            <ul className="space-y-3 text-sm text-zinc-300">
              <Outcome metric="15–40%" label="throughput uplift from debottlenecking — no capex" />
              <Outcome metric="3–8%"   label="recovery improvement on mature plants" />
              <Outcome metric="₹ / MT" label="reagent cost reduced 10–20% via dosing optimisation" />
              <Outcome metric="2–4×"   label="faster ramp-up vs unassisted commissioning" />
              <Outcome metric="< 2%"   label="unplanned-downtime after SOP + training rollout" />
            </ul>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Engagement models</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ModelCard tier="Single audit"
              best="You want a one-time outside-in review with clear recommendations"
              format="4–6 weeks. Fixed fee." />
            <ModelCard tier="Debottlenecking project"
              best="You have a specific bottleneck or ramp-up stall to solve"
              format="8–16 weeks. Milestone-based fee." highlight />
            <ModelCard tier="Fractional metallurgist retainer"
              best="You want a senior metallurgist on tap without hiring full-time"
              format="Monthly retainer. Remote + quarterly on-site visit." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Where we operate</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Hydromet refineries', 'Black-mass recovery lines', 'Secondary zinc / lead',
              'Aluminium dross plants', 'Copper SX-EW tankhouses', 'Precious-metal refining',
              'E-waste dismantling', 'Mineral-sands separation',
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300">{item}</div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Something not running as it should?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Describe the problem in a 15-minute call. We&apos;ll tell you whether a 1-day audit, a 3-month debottlenecking
            project, or a retainer is the right fit — and quote it on the spot.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Book a 15-min call <ArrowRight className="h-4 w-4" />
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest text-emerald-400/80">STEP {num}</span>
        <span className="text-[10px] text-zinc-500">{duration}</span>
      </div>
      <h3 className="text-base font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

function Outcome({ metric, label }: { metric: string; label: string }) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="text-2xl font-black text-emerald-400 shrink-0 w-16">{metric}</span>
      <span className="text-sm text-zinc-300">{label}</span>
    </li>
  );
}

function ModelCard({ tier, best, format, highlight }: { tier: string; best: string; format: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
      <h3 className="text-lg font-semibold mb-3">{tier}</h3>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Best when</p>
      <p className="text-sm text-zinc-300 mb-4">{best}</p>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Format</p>
      <p className="text-sm text-zinc-400">{format}</p>
    </div>
  );
}
