import Link from 'next/link';
import {
  GraduationCap, Beaker, FlaskConical, Cpu, ShieldCheck, BookOpen,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import JsonLd, { serviceSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION = 'Operator, lab analyst, and engineer training built from real plant SOPs — hydromet, electrowinning, ICP-OES/AAS, ERP/LIMS user training, and CPCB / BIS compliance.';

export const metadata = {
  title: 'Corporate Training — Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/talent/training' },
  openGraph: {
    title: 'Corporate Training — Rotehügels',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/talent/training',
    type: 'website',
  },
};

export default function CorporateTrainingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={serviceSchema({
        name: 'Corporate Training',
        description: DESCRIPTION,
        path: '/talent/training',
        serviceType: 'Industrial Training, Operator Certification, Lab Analyst Training, ERP/LIMS User Training',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Talent', path: '/talent' },
        { name: 'Corporate Training', path: '/talent/training' },
      ])} />

      {/* Cinematic hero */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <GraduationCap className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Talent · Corporate Training</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Train operators on the SOPs<br />
            <span className="text-rose-400">we wrote for your plant.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            Curriculum built from real commissioning logs, not textbooks. Every module is taught by engineers who have
            operated the unit-operation themselves — leach tanks, SX mixer-settlers, EW tankhouses, ICP-OES benches —
            and signed off on the SOPs being trained against.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/contact" className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors">
              Request a curriculum <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/talent/recruitment" className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors">
              Need to hire instead? →
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16 space-y-24">

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Programme tracks</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">Six tracks. Pick one, blend several, or commission a custom curriculum from your own SOPs.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Track icon={Beaker} title="Hydromet plant operators"
              body="Leaching, SX mixer-settler operation, electrowinning, crystallisation, reagent handling. Classroom + live-cell drills + competency sign-off." />
            <Track icon={FlaskConical} title="Lab analyst certification"
              body="ICP-OES, AAS, wet chem (titrations, gravimetry), sample prep & digestion, QA/QC, calibration, MU & uncertainty budgets, CRM handling." />
            <Track icon={GraduationCap} title="Process metallurgy fundamentals"
              body="Mid-management course: mass-balance, flowsheet logic, reagent economics, recovery vs throughput trade-offs. For supervisors moving into shift-in-charge roles." />
            <Track icon={Cpu} title="AutoREX™ / Operon / LabREX users"
              body="Role-based platform training tied to rollouts — operator dashboards, ERP transactions, LIMS login-to-COA workflows. Trained against your tenant, with your data." />
            <Track icon={ShieldCheck} title="EHS &amp; compliance"
              body="CPCB / SPCB consent regime, ZLD operation, EPR rules, BIS / DGFT updates, occupational safety, emergency response drills, ISO 9001 / 14001 / 45001 awareness." />
            <Track icon={BookOpen} title="Custom in-plant programme"
              body="We sit with your shift-in-charge, audit your existing SOPs, and write a curriculum tied to your unit-operations. Outcome-graded with operator competency cards." />
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">How a programme runs</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">From scoping to certification, with measurable competency at every step.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Phase num="1" title="Scoping &amp; baseline" duration="1 week"
              body="Audit existing SOPs, training records, and skill gaps. Define learning outcomes and competency rubric." />
            <Phase num="2" title="Curriculum build" duration="2–3 weeks"
              body="Modules written from your plant's flowsheet and reagent system. Trainer materials, operator handbooks, assessment papers." />
            <Phase num="3" title="Delivery" duration="1–4 weeks"
              body="Classroom sessions, on-the-job shadowing, control-room walkthroughs. Hybrid in-person + live online supported." />
            <Phase num="4" title="Certification" duration="Ongoing"
              body="Practical assessment, competency card issued per operator. Annual refresh + skill-matrix dashboard for HR." />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
            <h3 className="text-lg font-bold mb-4">Formats we deliver in</h3>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'On-site at your plant — classroom + control room + cell house',
                'At our Chennai pilot facility — live equipment for hands-on drills',
                'Live online — instructor-led video sessions with breakout labs',
                'Hybrid — fundamentals online, hands-on at your plant or ours',
                'Train-the-trainer — we equip your senior operators to run future cohorts',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <h3 className="text-lg font-bold mb-4">Deliverables you keep</h3>
            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                'Operator handbook (PDF + print) tied to your SOPs',
                'Trainer guide with talking points, time budgets, demo scripts',
                'Competency assessment papers + practical sign-off rubric',
                'Skill-matrix spreadsheet — by operator, by unit-operation',
                'Annual refresh syllabus + change-log when SOPs update',
                'Certificate of completion under Rotehügels letterhead',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Who we typically train</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'New-plant commissioning crews', 'Existing plant operators (refresh)',
              'Lab analysts &amp; QA technicians', 'Shift-in-charge upgrades',
              'Maintenance &amp; instrumentation', 'EHS &amp; compliance officers',
              'Project engineers (graduate trainees)', 'Customer teams adopting AutoREX',
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-300"
                dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Tell us what your team needs to learn</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Send us your unit-operation list and current SOPs. We&apos;ll come back with a curriculum, a delivery plan,
            and a fixed quote within a week.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            Request a curriculum <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}

function Track({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
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
