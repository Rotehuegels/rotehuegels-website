import Link from 'next/link';
import { Recycle, ArrowRight, Shield, Truck, Award, Leaf, AlertTriangle, Clock, Building2 } from 'lucide-react';

export const metadata = {
  title: 'E-Waste Collection — Rotehügels',
  description: 'Rotehügels is building an e-waste collection platform connecting generators with CPCB-registered recyclers. Currently in pre-launch — building recycler network and obtaining regulatory approvals.',
};

export default function EWasteLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Regulatory Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-300">
            <strong>Pre-Launch Phase:</strong> Roteh&uuml;gels is currently in the process of obtaining the necessary regulatory approvals
            (CTE/CTO from TNPCB and Authorization under E-Waste Management Rules, 2022) to operate as an e-waste aggregator.
            <strong> We are not yet authorized to collect or handle e-waste.</strong> This platform is being built in preparation.
            Recycler registrations are open to build our network ahead of launch.
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 mb-6">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Launching Soon — Building Network</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Your E-Waste,<br />
            <span className="text-emerald-400">Recycled Right.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            We&apos;re building a platform to connect e-waste generators directly with
            CPCB-registered recyclers — no middlemen, no landfills. Currently in pre-launch
            while we obtain regulatory approvals.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/ewaste/recycler-register"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Register as Recycler <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Regulatory Status */}
      <section className="py-12 px-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">Regulatory Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2, title: 'Facility Setup',
                status: 'In Progress',
                statusColor: 'text-amber-400',
                desc: 'Identifying and setting up a compliant collection/aggregation facility in Chennai.',
              },
              {
                icon: Shield, title: 'TNPCB Approval (CTE/CTO)',
                status: 'Pending Application',
                statusColor: 'text-amber-400',
                desc: 'Consent to Establish (CTE) and Consent to Operate (CTO) from Tamil Nadu Pollution Control Board.',
              },
              {
                icon: Award, title: 'E-Waste Authorization',
                status: 'Pending',
                statusColor: 'text-zinc-500',
                desc: 'Authorization under E-Waste (Management) Rules, 2022 as a Collection Agent / Aggregator.',
              },
            ].map(({ icon: Icon, title, status, statusColor, desc }) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <Icon className="h-8 w-8 text-zinc-600 mb-4" />
                <h3 className="text-base font-semibold mb-1">{title}</h3>
                <p className={`text-xs font-bold ${statusColor} mb-2`}>{status}</p>
                <p className="text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">How It Will Work</h2>
          <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">Once we receive regulatory approval, the platform will operate as follows:</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Request Pickup', desc: 'Fill the form with your e-waste details and preferred date', icon: Recycle },
              { step: '2', title: 'We Match', desc: 'We assign the nearest CPCB-registered recycler for your waste type', icon: Shield },
              { step: '3', title: 'Doorstep Collection', desc: 'Recycler picks up directly from your location — no drop-off needed', icon: Truck },
              { step: '4', title: 'Certificate Issued', desc: 'Get a recycling certificate for your records and compliance', icon: Award },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-xs text-emerald-400 font-bold mb-1">STEP {step}</div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we will collect */}
      <section className="py-16 px-6 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">What We Will Collect</h2>
          <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto">From household electronics to industrial equipment — all categories of e-waste, responsibly handled.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Computers & Laptops', 'Mobile Phones', 'Batteries (all types)', 'Monitors & TVs',
              'Printers & Peripherals', 'Cables & Wiring', 'PCBs & Circuit Boards', 'UPS & Power Supply',
              'Networking Equipment', 'Home Appliances', 'Industrial Electronics', 'Solar Panels',
            ].map(item => (
              <div key={item} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Why Roteh&uuml;gels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'CPCB Registered Partners', desc: 'We only partner with recyclers holding valid CPCB/SPCB registrations.' },
              { icon: Leaf, title: 'Zero Landfill Goal', desc: 'Every item will be responsibly recycled or refurbished — nothing to landfill.' },
              { icon: Truck, title: 'Full Traceability', desc: 'Every waste item tracked from collection to processing — e-waste passport compliant.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <Icon className="h-8 w-8 text-emerald-400 mb-4" />
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Register as Recycler */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a registered recycler?</h2>
          <p className="text-zinc-400 mb-4">Join our network now. We&apos;re onboarding CPCB-registered recyclers ahead of launch.</p>
          <p className="text-sm text-zinc-500 mb-8">Once we obtain authorization, we&apos;ll match you with e-waste generators in your area.</p>
          <Link
            href="/ewaste/recycler-register"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold text-white transition-colors"
          >
            Register as Recycler <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Legal disclaimer */}
      <section className="py-8 px-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto text-center text-xs text-zinc-600 space-y-2">
          <p>
            Rotehuegel Research Business Consultancy Private Limited is in the process of obtaining necessary
            regulatory approvals to operate as an e-waste collection agent/aggregator under the E-Waste (Management) Rules, 2022.
          </p>
          <p>
            <strong className="text-zinc-500">We are not currently authorized to collect, store, or transport e-waste.</strong>{' '}
            The collection request feature will be activated once CTE, CTO, and Authorization are obtained from TNPCB.
          </p>
          <p>
            Recycler registrations are being accepted to build our network in advance. No e-waste transactions will be facilitated until all regulatory requirements are met.
          </p>
        </div>
      </section>
    </div>
  );
}
