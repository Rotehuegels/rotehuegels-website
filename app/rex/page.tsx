import Link from 'next/link';
import { Users, Award, Globe, Leaf, Cpu, FlaskConical, Sparkles, ArrowRight } from 'lucide-react';

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

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default function RexPage() {
  return (
    <main className="relative pb-32">

      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Rotehügels Expert Network</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Join<br />
            <span className="text-rose-400">REX</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            A growing global community of experts, practitioners, and passionate individuals
            advancing sustainability, recycling, and plant automation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/rex/register"
              className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Register for free <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-[1800px] px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { value: 'Free', label: 'Lifelong membership' },
            { value: 'Global', label: 'Open to all geographies' },
            { value: 'REX ID', label: 'Unique identifier for life' },
            { value: 'No-obligation', label: 'Voluntary community' },
          ].map((s) => (
            <div key={s.label} className={`${glass} p-7 text-center`}>
              <p className="text-2xl font-bold text-rose-400">{s.value}</p>
              <p className="mt-2 text-xs text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who can join */}
      <section className="mx-auto max-w-[1800px] px-6 pb-20">
        <h2 className="text-3xl font-bold text-white mb-8">Who can join</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {WHO_CAN_JOIN.map(({ icon: Icon, label, desc }) => (
            <div key={label} className={`${glass} flex gap-5 p-8`}>
              <div className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-800/80 p-3">
                <Icon className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-base">{label}</p>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Focus areas */}
      <section className="mx-auto max-w-[1800px] px-6 pb-20">
        <h2 className="text-3xl font-bold text-white mb-8">Focus areas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FOCUS_AREAS.map((area) => (
            <div key={area} className={`${glass} px-5 py-4 text-sm text-zinc-300 leading-snug`}>
              <Cpu className="h-4 w-4 text-rose-400 mb-2.5" />
              {area}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-[1800px] px-6 pb-20">
        <h2 className="text-3xl font-bold text-white mb-8">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
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
            <div key={step} className={`${glass} p-8`}>
              <p className="text-4xl font-black text-rose-500/40">{step}</p>
              <p className="mt-4 font-semibold text-white text-base">{title}</p>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-[1800px] px-6 pb-20">
        <div className={`${glass} p-8`}>
          <h3 className="text-base font-semibold text-zinc-200 mb-5">Important — Please read</h3>
          <ul className="space-y-3 text-sm text-zinc-500 leading-relaxed">
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
      <section className="mx-auto max-w-[1800px] px-6 text-center">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-16">
          <h2 className="text-3xl font-bold text-white">Ready to join the network?</h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-base">
            Registration takes less than 2 minutes. Your REX ID will be emailed to you instantly.
          </p>
          <Link
            href="/rex/register"
            className="mt-8 inline-block rounded-xl bg-rose-600 px-10 py-4 text-sm font-semibold text-white hover:bg-rose-500 transition-colors"
          >
            Register now — it&apos;s free
          </Link>
        </div>
      </section>

    </main>
  );
}
