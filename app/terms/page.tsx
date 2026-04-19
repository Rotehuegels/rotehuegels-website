import Link from 'next/link';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Use — Rotehügels',
  description: 'The terms governing your use of Rotehügels.com, the India Circular Economy Ecosystem directory, and related services.',
};

const LAST_UPDATED = '19 April 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Terms of Use</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-10 text-xs text-amber-300/90">
          <p>
            <strong>Draft for counsel review.</strong> This document is a practical baseline that reflects our current services and data
            handling. Rotehügels will have this reviewed by qualified Indian counsel before a material public launch. Users with
            specific legal questions should seek their own advice.
          </p>
        </div>

        <section className="max-w-4xl space-y-6 text-sm text-zinc-300 leading-relaxed">

          <Section title="1. Acceptance">
            <p>
              These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of the website at{' '}
              <a href="https://www.rotehuegels.com" className="text-emerald-400 underline">www.rotehuegels.com</a> and any related
              sub-domains, APIs, dashboards, or client portals (collectively, the &ldquo;Platform&rdquo;), operated by <strong className="text-white">
              Rotehuegel Research Business Consultancy Private Limited</strong> (&ldquo;Rotehügels&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or
              &ldquo;us&rdquo;), a private company incorporated under the laws of India, with its registered office at Chennai, Tamil Nadu
              – 600052.
            </p>
            <p>
              By accessing, browsing, registering with, or otherwise using the Platform, you agree to these Terms. If you do not agree,
              please do not use the Platform.
            </p>
          </Section>

          <Section title="2. What we do">
            <p>
              Rotehügels operates a digital platform covering research, engineering, and execution services for critical minerals,
              metallurgy, and circular-economy projects. On the Platform we also publish:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>An India Circular Economy Ecosystem directory</strong> (&ldquo;Directory&rdquo;) at{' '}
                <Link href="/ecosystem" className="text-emerald-400 underline">/ecosystem</Link> — aggregated, publicly-sourced facility
                information on recyclers, reprocessors, primary metal producers, critical-minerals units, EV OEMs, battery-pack
                assemblers, and cell/CAM makers.
              </li>
              <li><strong>A recycling service page</strong> at{' '}
                <Link href="/recycling" className="text-emerald-400 underline">/recycling</Link> facilitating pickup requests and
                recycler registrations.
              </li>
              <li><strong>Registration forms</strong> for customers, suppliers, trading partners, and the REX Network.</li>
              <li><strong>A marketplace for buy / sell listings</strong> of metals, minerals, battery chain materials, end-of-life
                feedstock, and byproducts (currently in planning).</li>
            </ul>
          </Section>

          <Section title="3. Nature of our role — not a party to transactions">
            <p>
              Rotehügels acts as a <strong>digital facilitator</strong> connecting waste generators, material buyers, and material sellers
              with authorised recyclers, reprocessors, and dismantlers. We do not:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Collect, store, handle, or transport any waste or material.</li>
              <li>Act as an agent, aggregator, dismantler, reprocessor, or recycler.</li>
              <li>Take title to, broker, or underwrite any transaction.</li>
              <li>Guarantee the compliance, credentials, quality, quantity, price, or performance of any third party listed on the Platform.</li>
            </ul>
            <p>
              The responsibility for lawful collection, transportation, processing, and disposal of any waste stream and for performance
              of any transaction lies solely with the counter-parties to that transaction.
            </p>
          </Section>

          <Section title="4. Data accuracy disclaimer">
            <p>
              The Directory is compiled from publicly available information. We verify data on a rolling basis but cannot guarantee
              that any specific entry is current, complete, or accurate at the moment of use.
            </p>
            <p>
              This ecosystem is continuously evolving. We verify data on a rolling basis but cannot guarantee that any specific entry is
              current, complete, or accurate at the moment of use. You must independently verify facility credentials (CPCB/SPCB/MoEF
              authorisations), contact details, and operating status directly with the relevant regulator or the facility before relying
              on the data for any commercial or compliance purpose.
            </p>
            <p>
              If you spot a missing facility, outdated contact, or an incorrect classification, please write to{' '}
              <a href="mailto:info@rotehuegels.com" className="text-emerald-400 underline">info@rotehuegels.com</a>.
            </p>
          </Section>

          <Section title="5. Your obligations">
            <p>When you use the Platform, you agree that you will not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Platform for any unlawful purpose, including the disposal of waste in breach of the E-Waste (Management) Rules, 2022; Battery Waste Management Rules, 2022; Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016; or any other applicable environmental law.</li>
              <li>Scrape, copy, or redistribute Platform content in bulk without our written permission.</li>
              <li>Introduce malware, circumvent security, or attempt unauthorised access to systems or data.</li>
              <li>Impersonate any person, entity, or regulatory authority.</li>
              <li>Post false, misleading, defamatory, or unlawful content in any form (including in marketplace listings when live).</li>
              <li>Use the Platform to solicit transactions in contraband, stolen material, or items whose sale requires licences you do not hold.</li>
            </ul>
          </Section>

          <Section title="6. Registration &amp; accounts">
            <p>
              Some parts of the Platform require registration (for example supplier / customer / recycler registration, the REX Network,
              and the internal dashboard). You agree to provide accurate information, keep your contact details current, and keep any
              credentials confidential. You are responsible for all activity under your account. Notify us immediately of any
              unauthorised use.
            </p>
          </Section>

          <Section title="7. Marketplace listings (when live)">
            <p>
              When the buy/sell marketplace feature is enabled, additional rules apply. You alone are responsible for the accuracy,
              legality, and performance of any listing you post. Rotehügels may remove any listing without notice if we believe in good
              faith that it breaches these Terms, applicable law, or the listing moderation policy.
            </p>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              The Platform&apos;s design, code, written content, logos, and compiled Directory (as an original work of authorship) are
              owned by or licensed to Rotehügels and protected by Indian and international copyright and trade-mark laws. Individual
              facts (names, addresses, capacities, public contact points) are not copyrightable and may be reused with attribution; our
              original editorial compilation, categorisation, and GPS-plant-level curation is protected.
            </p>
            <p>
              You grant Rotehügels a non-exclusive, worldwide, royalty-free licence to use, display, and moderate any content you
              submit to the Platform (including marketplace listings and registration information) for the purpose of operating the
              Platform and fulfilling your request.
            </p>
          </Section>

          <Section title="9. Privacy">
            <p>
              Your use of the Platform is also governed by our{' '}
              <Link href="/privacy" className="text-emerald-400 underline">Privacy Policy</Link>. By using the Platform you consent to
              the collection, use, and disclosure of information as described there.
            </p>
          </Section>

          <Section title="10. Disclaimers &amp; limitation of liability">
            <p>
              The Platform is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo; basis. To the maximum extent permitted by law,
              Rotehügels disclaims all express and implied warranties, including merchantability, fitness for a particular purpose, and
              non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses.
            </p>
            <p>
              To the maximum extent permitted by law, Rotehügels shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising out of or relating to your use of (or inability to use) the Platform, any
              transaction with a third party, or any reliance placed on Directory data.
            </p>
          </Section>

          <Section title="11. Indemnity">
            <p>
              You agree to indemnify and hold harmless Rotehügels and its personnel against any claim, liability, loss, or expense
              (including reasonable legal fees) arising from your breach of these Terms, your violation of law, or your misuse of the
              Platform.
            </p>
          </Section>

          <Section title="12. Grievances">
            <p>
              For any grievance, data-accuracy correction, takedown request, or content complaint, please refer to our{' '}
              <Link href="/grievance" className="text-emerald-400 underline">Grievance Redressal Policy</Link>. It names our
              Grievance Officer and describes acknowledgement and resolution timelines as required by the Information Technology
              (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
            </p>
          </Section>

          <Section title="13. Governing law &amp; jurisdiction">
            <p>
              These Terms are governed by the laws of India. The courts at Chennai, Tamil Nadu shall have exclusive jurisdiction over
              any dispute arising out of or in connection with these Terms or your use of the Platform.
            </p>
          </Section>

          <Section title="14. Changes">
            <p>
              We may update these Terms from time to time. Material changes will be notified on this page with a revised &ldquo;last
              updated&rdquo; date. Continued use of the Platform after such changes constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              Questions about these Terms may be sent to{' '}
              <a href="mailto:info@rotehuegels.com" className="text-emerald-400 underline">info@rotehuegels.com</a> or by post to our
              registered office in Chennai.
            </p>
          </Section>

        </section>

        <p className="mt-12 text-xs text-zinc-600">
          © {new Date().getFullYear()} Rotehuegel Research Business Consultancy Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
