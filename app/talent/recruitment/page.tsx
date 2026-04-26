import Link from 'next/link';
import {
  Users, Briefcase, Microscope, Factory, ShieldCheck, Sparkles,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Specialist recruitment for metals, recycling and process industries — metallurgists, plant managers, lab heads, EHS / compliance leads. Drawn from the REX expert network and our active candidate pool.';

export const metadata = {
  title: 'Recruitment — Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/talent/recruitment' },
  openGraph: {
    title: 'Recruitment — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/talent/recruitment',
    type: 'website',
  },
};

export default function RecruitmentPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={serviceSchema({
        name: 'Recruitment',
        description: DESCRIPTION,
        path: '/talent/recruitment',
        serviceType: 'Specialist Recruitment, Retained Search, Embedded Hiring, Talent Advisory',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Talent', path: '/talent' },
        { name: 'Recruitment', path: '/talent/recruitment' },
      ])} />

      {/* Cinematic hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <Users className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Talent · Recruitment</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            We&apos;ve worked with the people<br />
            <span className="text-rose-400">we put on your shortlist.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            Specialist recruitment for the corner of industry we already operate in — metals, recycling, hydromet,
            secondary smelting, electrowinning, lab. Most of our shortlist is sourced from engineers and analysts
            we&apos;ve directly worked alongside on Rotehügels engagements, or from the REX expert network we curate.
            No keyword-matched databases.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/contact" className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors">
              Open a search <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/rex" className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors">
              Join the REX network
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16 space-y-24">

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Roles we recruit for</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Mid-senior to head-of-function. We do not run volume / graduate hiring.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Role icon={Factory} title="Plant &amp; operations leadership"
              body="Plant managers, operations heads, shift-in-charge, commissioning leads, electrowinning specialists, SX operators." />
            <Role icon={Briefcase} title="Process &amp; project engineering"
              body="Senior process metallurgists, project managers, design engineers (PFD / P&amp;ID), procurement leads for long-lead items." />
            <Role icon={Microscope} title="Lab &amp; analytical"
              body="Lab heads, QA / QC managers, ICP-OES / AAS analysts, wet-chemistry seniors, NABL accreditation leads." />
            <Role icon={ShieldCheck} title="EHS, ESG &amp; compliance"
              body="EHS managers, ESG / sustainability leads, CPCB / SPCB liaison, EPR compliance officers, ISO accreditation owners." />
            <Role icon={Sparkles} title="Digital &amp; data roles for industry"
              body="ERP / LIMS implementation leads, control-system engineers, plant data scientists, AutoREX / Operon / LabREX power users." />
            <Role icon={Users} title="Commercial &amp; functional"
              body="Sales heads for industrial customers, supply-chain managers, finance leaders for manufacturing, HR for plant locations." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">How a search runs</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Quality-first sourcing with a clear weekly cadence — not a flood of CVs.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Phase num="1" title="Brief &amp; calibration" duration="Week 1"
              body="Role spec, must-haves vs nice-to-haves, package envelope, calibration call against 2–3 anonymised profiles before we go to market." />
            <Phase num="2" title="Sourcing" duration="Weeks 1–3"
              body="Direct outreach to REX network and our targeted longlist. No mass postings unless explicitly requested." />
            <Phase num="3" title="Shortlist" duration="Weeks 3–5"
              body="3–5 deeply assessed candidates. Reference notes, technical assessment, and our honest read on each. Weekly status." />
            <Phase num="4" title="Close" duration="Weeks 5–8"
              body="Interview coordination, offer guidance, reference checks, counter-offer management, 3-month post-join check-in with hire and manager." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Engagement models</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <ModelCard tier="Retained search"
              best="Senior or hard-to-fill role where shortlist quality matters more than speed"
              format="Three-tranche fee (engage / shortlist / close). Exclusive mandate." highlight />
            <ModelCard tier="Contingency"
              best="Mid-level role with multiple agencies in market"
              format="Fee on placement only. Non-exclusive. Limited bandwidth — we take selected briefs." />
            <ModelCard tier="Embedded recruiter"
              best="You're hiring 3+ specialist roles in 6 months and want a single dedicated owner"
              format="Monthly retainer. Our recruiter integrates with your hiring loop and ATS." />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h3 className="text-lg font-bold mb-4">Why clients use us instead of generalist agencies</h3>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'We have actually run the unit-operations the candidate will manage',
                'REX network gives us pre-vetted specialists, not LinkedIn keyword scrapes',
                'Every shortlist comes with our honest read — strengths, risks, and likely fit',
                'Technical assessment is done by Rotehügels engineers, not HR generalists',
                'We turn down briefs we can&apos;t deliver well — capacity over churn',
                '3-month post-join check-in with both hire and manager',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <h3 className="text-lg font-bold mb-4">Sectors we recruit into</h3>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'Hydromet refineries — Cu, Ni, Co, Zn, PGM',
                'Battery recycling &amp; black mass recovery',
                'Secondary zinc, lead, aluminium',
                'E-waste dismantling &amp; precious-metal refining',
                'NABL labs &amp; testing facilities',
                'Process plant EPC &amp; engineering consultancies',
                'ERP / LIMS implementation partners',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-2">For candidates</p>
              <h2 className="text-xl md:text-2xl font-semibold">Looking for your next role in metals or recycling?</h2>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-3xl">
                Join the REX expert network. We notify members first when new searches open in their domain. No
                spam, no public CV listings — your details are shared with clients only when you say yes to a brief.
              </p>
            </div>
            <Link
              href="/rex"
              className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors whitespace-nowrap"
            >
              Join REX →
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Got a role to fill?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Send us the job spec or just describe the gap. We&apos;ll come back within two business days with a fee
            structure and an honest call on whether the role is one we can deliver on.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Open a search <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}

function Role({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
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
