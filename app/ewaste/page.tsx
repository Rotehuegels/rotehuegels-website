import Link from 'next/link';
import { Recycle, ArrowRight, Shield, Truck, Award, Leaf } from 'lucide-react';

export const metadata = {
  title: 'E-Waste Collection — Rotehügels',
  description: 'Schedule free e-waste collection. We connect you directly with CPCB-registered recyclers. Responsible disposal for computers, batteries, phones, and industrial electronics.',
};

export default function EWasteLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-6">
            <Recycle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Responsible E-Waste Disposal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Your E-Waste,<br />
            <span className="text-emerald-400">Recycled Right.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Schedule a free pickup for your electronic waste. We connect you directly with
            CPCB-registered recyclers — no middlemen, no landfills.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/ewaste/request"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Schedule Pickup <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
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

      {/* What we collect */}
      <section className="py-16 px-6 bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">What We Collect</h2>
          <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto">From household electronics to industrial equipment — we handle all categories of e-waste responsibly.</p>
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
              { icon: Shield, title: 'CPCB Registered', desc: 'All our recycler partners hold valid CPCB/SPCB registrations for e-waste handling.' },
              { icon: Leaf, title: 'Zero Landfill', desc: 'Every item is responsibly recycled or refurbished — nothing goes to landfill.' },
              { icon: Truck, title: 'Free Doorstep Pickup', desc: 'No drop-off locations needed. We come to you — homes, offices, or factories.' },
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

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to recycle?</h2>
          <p className="text-zinc-400 mb-8">It takes less than 2 minutes to schedule a pickup.</p>
          <Link
            href="/ewaste/request"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold text-white transition-colors"
          >
            Schedule Free Pickup <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
