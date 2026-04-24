import Link from 'next/link';
import { Recycle, ArrowRight, Shield, Truck, Award, Leaf, CheckCircle2 } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Request a Pickup — Responsible Recycling · Rotehügels',
  description: 'Request an authorised recycler pickup for your e-waste, batteries, non-ferrous metals, zinc dross, or black mass. Rotehügels connects generators with CPCB/SPCB/MoEF-authorised facilities across India — no middlemen, no landfills.',
};

export default async function EWasteLandingPage() {
  const { count } = await supabaseAdmin
    .from('recyclers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  const facilityCount = count ?? 0;
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* intentionally empty — disclaimer at bottom */}

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-6">
            <Recycle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Responsible Recycling Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Your Waste,<br />
            <span className="text-emerald-400">Recycled Right.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Connecting waste generators directly with authorised recyclers and reprocessors across India —
            e-waste, batteries, non-ferrous metals, zinc dross, black mass. No middlemen, no landfills.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/recycling/quote"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Get Instant Quote <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/recycling/recycler-register"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              Register as Recycler
            </Link>
            <Link
              href="/ecosystem"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              Browse the Full Ecosystem ({facilityCount.toLocaleString('en-IN')} facilities)
            </Link>
          </div>
        </div>
      </section>

      {/* Credibility ribbon — routes to /ecosystem for the full tier breakdown */}
      <section className="py-6 px-6 border-t border-zinc-800 bg-zinc-900/20">
        <div className="max-w-[1800px] mx-auto text-center text-sm text-zinc-400">
          Part of the <Link href="/ecosystem" className="text-emerald-400 hover:text-emerald-300 underline">India Circular Economy Ecosystem</Link> — {facilityCount.toLocaleString('en-IN')} verified facilities across the value chain.
          {' '}
          <Link href="/ecosystem" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
            Browse the directory <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Our Model */}
      <section className="py-12 px-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-[1800px] mx-auto">
          <h2 className="text-xl font-bold text-center mb-3">Our Model</h2>
          <p className="text-zinc-500 text-center mb-8 max-w-xl mx-auto">We are a digital facilitator — not an aggregator. We don&apos;t touch the waste.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Recycle, title: 'No Physical Handling',
                desc: 'We never collect, store, or transport waste. Materials move directly from generator to recycler.',
              },
              {
                icon: Shield, title: 'Only Registered Recyclers',
                desc: 'Every recycler on our platform must hold valid CPCB/SPCB authorization. We verify credentials before onboarding.',
              },
              {
                icon: Award, title: 'Full Traceability',
                desc: 'Every transaction is tracked end-to-end. Processing certificates issued by the recycler. Fully compliant.',
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
        <div className="max-w-[1800px] mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto">Simple, traceable, and compliant.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Request Pickup', desc: 'Fill the form with your waste details and preferred date', icon: Recycle },
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
        <div className="max-w-[1800px] mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">What We Cover</h2>
          <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto">From household electronics to industrial metal scrap — all major recyclable waste streams.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Computers & Laptops', 'Mobile Phones', 'Monitors & TVs', 'PCBs & Circuit Boards',
              'Lithium-ion Batteries', 'Lead-acid Batteries', 'UPS & Power Supply', 'Solar Panels',
              'Copper Scrap & Wiring', 'Aluminium Scrap', 'Brass & Bronze', 'Zinc Dross & Ash',
              'Stainless Steel Scrap', 'Industrial Electronics', 'Home Appliances', 'Cables & Harnesses',
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
        <div className="max-w-[1800px] mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Why Roteh&uuml;gels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Shield, title: 'CPCB / MoEF Registered Partners', desc: 'We only partner with recyclers and reprocessors holding valid CPCB, SPCB, or MoEF authorisation.' },
              { icon: Leaf, title: 'Zero Landfill Goal', desc: 'Every material is responsibly recovered, reprocessed or refurbished — nothing to landfill.' },
              { icon: Truck, title: 'Full Traceability', desc: 'Every consignment tracked from generator to processor — compliant with E-Waste, Battery Waste, and Hazardous Waste Rules.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <Icon className="h-8 w-8 text-emerald-400 mb-4" />
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
          <ul className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-zinc-300">
            {[
              'Licence-class verification against CPCB / SPCB registries',
              'Capacity headroom, material capability, and geographic fit built into the match',
              'Transporter and weighbridge integration at every handover',
              'Chain-of-custody data captured end to end',
              'EPR-fulfilment certificate issued on closure',
              'Generator, recycler, and brand-owner views in one workspace',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Legal disclaimer */}
      <section className="py-8 px-6 border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-[1800px] mx-auto text-xs text-zinc-600 space-y-2">
          <p><strong className="text-zinc-500">Disclaimer:</strong></p>
          <p>
            Rotehuegel Research Business Consultancy Private Limited (&ldquo;Roteh&uuml;gels&rdquo;) operates solely as a digital platform facilitating
            the connection between waste generators and authorised recyclers, reprocessors, and dismantlers across categories including
            e-waste, batteries, non-ferrous metals, and zinc dross. Roteh&uuml;gels does not physically collect, store, handle, or transport
            any waste. All material is moved directly from the generator to the authorised recycler or reprocessor.
          </p>
          <p>
            Roteh&uuml;gels is not an aggregator, dismantler, reprocessor, or recycler. The responsibility for lawful collection, transportation,
            processing, and disposal of any waste stream lies solely with the CPCB, SPCB, or MoEF-authorised facility.
          </p>
          <p>
            All facilities listed on this platform are required to hold valid authorisations under the applicable rules, including but not limited to
            the E-Waste (Management) Rules, 2022, the Battery Waste Management Rules, 2022, the Hazardous and Other Wastes (Management and
            Transboundary Movement) Rules, 2016, and relevant MoEF/CPCB reprocessor registrations.
            Roteh&uuml;gels verifies credentials at the time of registration but does not guarantee ongoing compliance.
            Users are advised to independently verify facility credentials before engaging.
          </p>
          <p>
            This platform is provided &ldquo;as is&rdquo; for informational and facilitation purposes. Roteh&uuml;gels shall not be liable for
            any loss, damage, or regulatory non-compliance arising from transactions facilitated through this platform.
            Subject to Chennai jurisdiction.
          </p>
        </div>
      </section>

      {/* Data sources — single link, full list lives on /ecosystem */}
      <section className="py-6 px-6 border-t border-zinc-800">
        <div className="max-w-[1800px] mx-auto text-xs text-zinc-600 text-center">
          Data sourced from CPCB, SPCB, MPCB, MoEF registries and public disclosures.{' '}
          <Link href="/ecosystem#references" className="text-zinc-500 hover:text-zinc-300 underline">
            See full references & data sources →
          </Link>
        </div>
      </section>
    </div>
  );
}
