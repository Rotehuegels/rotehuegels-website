import Link from 'next/link';
import { GraduationCap, Users, ArrowRight, CheckCircle2, Sparkles, UsersRound } from 'lucide-react';

export default function TalentOverviewPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Cinematic hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <UsersRound className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Talent</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            The plants we build are only as good as<br />
            <span className="text-rose-400">the people who run them.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            Two services that close the people-side of every project we deliver — corporate training that turns
            crews into operators, and specialist recruitment that finds the metallurgists, lab heads, and plant
            managers our industry actually needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/contact" className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors">
              Talk to us <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/rex" className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors">
              Visit the REX Network
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16 space-y-20">

        <section className="grid md:grid-cols-2 gap-6">
          <PillarCard
            icon={GraduationCap}
            title="Corporate Training"
            href="/talent/training"
            tagline="Operator, analyst, and engineer programmes"
            points={[
              'Hydromet operator training — leaching, SX, EW, crystallisation',
              'Lab analyst certification — ICP-OES, AAS, wet chem, sample prep',
              'Process metallurgy fundamentals for mid-management',
              'EHS, CPCB / SPCB compliance, BIS / DGFT regulatory updates',
              'AutoREX™, Operon and LabREX user training tied to rollouts',
            ]}
          />
          <PillarCard
            icon={Users}
            title="Recruitment"
            href="/talent/recruitment"
            tagline="Specialist hires for metals, recycling & lab"
            points={[
              'Plant managers, process metallurgists, electrowinning specialists',
              'Lab heads, analytical chemists, QA / QC supervisors',
              'EHS, ESG, compliance and regulatory leads',
              'Project managers and commissioning engineers',
              'Drawn from our REX expert network and active candidate pool',
            ]}
          />
        </section>

        <section className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <p className="text-xs tracking-widest text-rose-400/90 uppercase mb-2 inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Adjacent to Talent
              </p>
              <h2 className="text-xl md:text-2xl font-semibold">REX Network — our expert community</h2>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-3xl">
                Independent metallurgists, lab specialists, EHS reviewers and plant veterans we collaborate with on
                projects — and the talent pool we draw on for retained search assignments. Apply to join, or hire
                from the network.
              </p>
            </div>
            <Link
              href="/rex"
              className="inline-flex items-center justify-center rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors whitespace-nowrap"
            >
              Explore REX →
            </Link>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Why both services live under one roof</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Most of our customers come to us with the same problem twice: build the plant, then find and train the team that runs it.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Reason title="We've operated what we teach"
              body="Our trainers have commissioned the unit-operations they instruct on. Curricula are written from operating logs, not textbooks." />
            <Reason title="The REX network is a real candidate pool"
              body="Specialists already vetted on Rotehügels engagements form the backbone of our search shortlists. No cold-database scraping." />
            <Reason title="One integrated programme"
              body="Train your incoming hires the week they join, on the same SOPs and dashboards we wrote during the project. No knowledge handoff gap." />
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need a team, or need to upskill the one you have?</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Tell us what you&apos;re hiring for or what your operators need to learn — we&apos;ll tell you on the same call
            whether a training programme, a retained search, or a combination is the right fit.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Book a 15-min call <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}

function PillarCard({
  icon: Icon, title, href, tagline, points,
}: {
  icon: React.ElementType;
  title: string;
  href: string;
  tagline: string;
  points: string[];
}) {
  return (
    <Link href={href}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8 hover:border-emerald-500/40 hover:bg-zinc-900/60 transition-colors group">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-7 w-7 text-emerald-400" />
        <div>
          <h3 className="text-xl font-semibold group-hover:text-emerald-400 transition-colors">{title}</h3>
          <p className="text-xs text-zinc-500">{tagline}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-zinc-300 leading-relaxed">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/80 shrink-0 mt-0.5" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-emerald-400/80 group-hover:text-emerald-400">Learn more →</p>
    </Link>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
