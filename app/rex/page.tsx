import Link from 'next/link';
import { Users, Award, Globe, Leaf, Cpu, FlaskConical } from 'lucide-react';
import AuraBackground from './AuraBackground';

export const metadata = {
  title: 'REX — Rotehügels Expert Network',
  description:
    'Join REX — the Rotehügels Expert Network. A growing global community of students, professionals, academics, and enthusiasts in sustainability, recycling, and plant automation.',
};

const WHO_CAN_JOIN = [
  {
    icon: FlaskConical,
    label: 'Students',
    desc: 'Final-year and postgraduate students in metallurgy, chemistry, chemical engineering, environmental science, or related fields.',
  },
  {
    icon: Award,
    label: 'Professionals',
    desc: 'Industry practitioners in mining, metals processing, recycling, EPC, plant operations, and industrial automation.',
  },
  {
    icon: Globe,
    label: 'Academics',
    desc: 'Researchers, faculty, and scientists working in materials science, process engineering, sustainability, or circular economy.',
  },
  {
    icon: Leaf,
    label: 'Enthusiasts',
    desc: 'Individuals passionate about sustainability, clean technology, resource recovery, and the future of industrial systems.',
  },
];

const FOCUS_AREAS = [
  'Hydrometallurgy & Extractive Metallurgy',
  'Battery Recycling & Critical Minerals',
  'Circular Economy & Waste-to-Value',
  'Plant Automation & Process Control',
  'EPC & Industrial Project Delivery',
  'Sustainability & ESG',
  'AI & Digital Twins for Industry',
  'Environmental Compliance & Policy',
];

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40';

export default function RexPage() {
  return (
    <main className="relative space-y-16 pb-20">
      <AuraBackground />
      <div>

        {/* Hero — no card needed, large text is readable */}
        <section className="mx-auto max-w-5xl px-6 pt-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-medium text-rose-400 mb-6">
            <Users className="h-3.5 w-3.5" />
            Rotehügels Expert Network
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Join{' '}
            <span className="bg-gradient-to-r from-rose-400 to-rose-300 bg-clip-text text-transparent">
              REX
            </span>
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-zinc-200 text-lg drop-shadow">
            A growing global community of experts, practitioners, and passionate individuals
            advancing sustainability, recycling, and plant automation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/rex/register"
              className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors shadow-lg"
            >
              Register for free
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              How it works
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'Free', label: 'Lifelong membership' },
              { value: 'Global', label: 'Open to all geographies' },
              { value: 'REX ID', label: 'Unique identifier for life' },
              { value: 'No-obligation', label: 'Voluntary community' },
            ].map((s) => (
              <div key={s.label} className={`${glass} p-5 text-center`}>
                <p className="text-xl font-bold text-rose-400">{s.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who can join */}
        <section className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-white mb-6 drop-shadow">Who can join</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {WHO_CAN_JOIN.map(({ icon: Icon, label, desc }) => (
              <div key={label} className={`${glass} flex gap-4 p-6`}>
                <div className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-800/80 p-2.5">
                  <Icon className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{label}</p>
                  <p className="mt-1 text-sm text-zinc-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Focus areas */}
        <section className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-white mb-6 drop-shadow">Focus areas</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FOCUS_AREAS.map((area) => (
              <div key={area} className={`${glass} px-4 py-3 text-sm text-zinc-300`}>
                <Cpu className="h-3.5 w-3.5 text-rose-400 mb-1.5" />
                {area}
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-white mb-6 drop-shadow">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Register',
                desc: 'Fill in a simple form with your name, date of birth, email, LinkedIn profile, and area of interest. Completely free.',
              },
              {
                step: '02',
                title: 'Get your REX ID',
                desc: 'A unique REX ID is instantly assigned and emailed to you. Format: REXYYYYMMDD + sequence. Your lifelong membership identifier.',
              },
              {
                step: '03',
                title: 'Stay connected',
                desc: 'You may be reached out by Rotehügels based on your profile for project opportunities, collaborations, or engagements — at any time.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className={`${glass} p-6`}>
                <p className="text-3xl font-black text-rose-500/40">{step}</p>
                <p className="mt-2 font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-5xl px-6">
          <div className={`${glass} p-6`}>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Important — Please read</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>• REX membership is <strong className="text-zinc-400">voluntary and complimentary</strong>. There is no fee at any stage.</li>
              <li>• Joining REX does <strong className="text-zinc-400">not guarantee</strong> any immediate assignment, project engagement, or compensation.</li>
              <li>• You may be contacted by Rotehügels based on your profile and our project requirements, in line with company policy at that time.</li>
              <li>• <strong className="text-zinc-400">Duplicate registrations are not permitted.</strong> One registration per person, verified by email address.</li>
              <li>• Your REX ID and membership are <strong className="text-zinc-400">lifelong</strong> with no renewal needed.</li>
              <li>• Your personal data is stored securely and will not be shared with third parties without consent.</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 text-center">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-10">
            <h2 className="text-2xl font-bold text-white">Ready to join the network?</h2>
            <p className="mt-2 text-zinc-400 max-w-xl mx-auto">
              Registration takes less than 2 minutes. Your REX ID will be emailed to you instantly.
            </p>
            <Link
              href="/rex/register"
              className="mt-6 inline-block rounded-xl bg-rose-600 px-8 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition-colors"
            >
              Register now — it&apos;s free
            </Link>
          </div>
        </section>

      </div>{/* end z-10 */}
    </main>
  );
}
