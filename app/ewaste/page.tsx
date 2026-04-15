import Link from 'next/link';
import { Recycle, ArrowRight, Shield, Truck, Award, Leaf, AlertTriangle, Clock, Building2 } from 'lucide-react';

export const metadata = {
  title: 'E-Waste Collection — Rotehügels',
  description: 'Rotehügels is building an e-waste collection platform connecting generators with CPCB-registered recyclers. Currently in pre-launch — building recycler network and obtaining regulatory approvals.',
};

export default function EWasteLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* intentionally empty — disclaimer at bottom */}

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
            Connecting e-waste generators directly with CPCB-registered recyclers.
            No middlemen, no landfills — waste goes straight from your door to the recycler.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/ewaste/quote"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Get Instant Quote <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/ewaste/recycler-register"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              Register as Recycler
            </Link>
          </div>
        </div>
      </section>

      {/* Our Model */}
      <section className="py-12 px-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-3">Our Model</h2>
          <p className="text-zinc-500 text-center mb-8 max-w-xl mx-auto">We are a digital facilitator — not an aggregator. We don&apos;t touch the waste.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Recycle, title: 'No Physical Handling',
                desc: 'We never collect, store, or transport e-waste. Waste moves directly from generator to recycler.',
              },
              {
                icon: Shield, title: 'Only Registered Recyclers',
                desc: 'Every recycler on our platform must hold valid CPCB/SPCB authorization. We verify credentials before onboarding.',
              },
              {
                icon: Award, title: 'Full Traceability',
                desc: 'Every transaction is tracked end-to-end. Processing certificates issued by the recycler. E-waste passport compliant.',
              },
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

      {/* How it works */}
      <section id="how-it-works" className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">Simple, traceable, and compliant.</p>
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
          <h2 className="text-2xl font-bold text-center mb-4">What We Collect</h2>
          <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto">From household electronics to industrial equipment — all categories of e-waste.</p>
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
        <div className="max-w-5xl mx-auto text-xs text-zinc-600 space-y-2">
          <p><strong className="text-zinc-500">Disclaimer:</strong></p>
          <p>
            Rotehuegel Research Business Consultancy Private Limited (&ldquo;Roteh&uuml;gels&rdquo;) operates solely as a digital platform facilitating
            the connection between e-waste generators and CPCB/SPCB-registered recyclers. Roteh&uuml;gels does not physically collect, store, handle,
            or transport any e-waste. All e-waste is transported directly from the generator to the registered recycler.
          </p>
          <p>
            Roteh&uuml;gels is not an e-waste aggregator, dismantler, or recycler. The responsibility for lawful collection, transportation,
            processing, and disposal of e-waste lies solely with the CPCB/SPCB-authorized recycler.
          </p>
          <p>
            All recyclers listed on this platform are required to hold valid authorizations under the E-Waste (Management) Rules, 2022.
            Roteh&uuml;gels verifies credentials at the time of registration but does not guarantee ongoing compliance.
            Users are advised to independently verify recycler credentials before engaging.
          </p>
          <p>
            This platform is provided &ldquo;as is&rdquo; for informational and facilitation purposes. Roteh&uuml;gels shall not be liable for
            any loss, damage, or regulatory non-compliance arising from transactions facilitated through this platform.
            Subject to Chennai jurisdiction.
          </p>
        </div>
      </section>

      {/* References & Sources */}
      <section className="py-6 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto text-xs text-zinc-600 space-y-3">
          <p className="font-semibold text-zinc-500">References &amp; Data Sources</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Central Pollution Control Board (CPCB) — <em>List of Dismantlers/Recyclers as per the authorisation issued by SPCBs/PCCs under E-Waste (Management) Rules, 2022 (As on 08-06-2023)</em> — <a href="https://www.cpcb.nic.in/e-waste-recyclers-dismantler/" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">cpcb.nic.in</a></li>
            <li>NDMC — <em>CPCB Approved List of E-Waste Recyclers/Dismantler</em> — <a href="https://www.ndmc.gov.in/pdf/cpcb_approved_list_of_e-waste_recyclers_dismantler.pdf" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">ndmc.gov.in (PDF)</a></li>
            <li>CPCB E-Waste EPR Portal — <a href="https://eprewastecpcb.in/" className="text-zinc-500 hover:text-zinc-300 underline" target="_blank" rel="noopener noreferrer">eprewastecpcb.in</a></li>
            <li>E-Waste (Management) Rules, 2022 — Ministry of Environment, Forest and Climate Change, Government of India</li>
          </ol>
          <p className="italic text-zinc-700">
            Any omissions or errors in the data presented on this platform are not intentional. Information is sourced from publicly
            available government records and may not reflect the most current status. Users are advised to verify details independently
            with the respective SPCB/PCC or directly with the recycler.
          </p>
        </div>
      </section>
    </div>
  );
}
