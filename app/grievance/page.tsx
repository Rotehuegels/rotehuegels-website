import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';

export const metadata = {
  title: 'Grievance Redressal — Rotehügels',
  description: 'How to file a grievance with Rotehügels, our Grievance Officer details, and statutory timelines under IT Rules 2021 and DPDP Act 2023.',
};

const LAST_UPDATED = '19 April 2026';

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Grievance Redressal</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-10 text-xs text-amber-300/90">
          <p>
            <strong>Draft for counsel review.</strong> This page describes our grievance-handling process. The named officer and
            timelines will be confirmed before a material public launch.
          </p>
        </div>

        <section className="max-w-4xl space-y-6 text-sm text-zinc-300 leading-relaxed">

          <Section title="1. When to file a grievance">
            <p>You may file a grievance with Rotehügels in any of the following situations:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A Directory entry is inaccurate, outdated, or incorrectly classified.</li>
              <li>A facility listing should be removed or corrected.</li>
              <li>Personal data about you is being processed and you wish to exercise your rights under the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) — access, correction, erasure, nomination, or withdrawal of consent.</li>
              <li>Content on the Platform infringes your copyright, trade-mark, or other intellectual-property right.</li>
              <li>A marketplace listing (when live) is misleading, fraudulent, or otherwise in breach of our Terms.</li>
              <li>You experienced a privacy incident, suspected data breach, or security concern.</li>
              <li>Any other complaint regarding our services or compliance with law.</li>
            </ul>
          </Section>

          <Section title="2. Grievance Officer">
            <p>
              In compliance with Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules,
              2021 and Section 11 of the Digital Personal Data Protection Act, 2023, our Grievance Officer is:
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm">
              <p><strong className="text-white">Mr. Sivakumar Shanmugam</strong></p>
              <p className="text-zinc-400">Founder &amp; Director</p>
              <p className="text-zinc-400">Rotehuegel Research Business Consultancy Private Limited</p>
              <p className="text-zinc-400 mt-2">Registered office: Chennai, Tamil Nadu – 600052, India</p>
              <p className="mt-3">
                Email (grievances): <a href="mailto:grievance@rotehuegels.com" className="text-emerald-400 underline">grievance@rotehuegels.com</a>
              </p>
              <p>
                Email (privacy): <a href="mailto:privacy@rotehuegels.com" className="text-emerald-400 underline">privacy@rotehuegels.com</a>
              </p>
              <p>
                Email (general): <a href="mailto:info@rotehuegels.com" className="text-emerald-400 underline">info@rotehuegels.com</a>
              </p>
            </div>
          </Section>

          <Section title="3. How to file">
            <p>Send an email to the relevant address above. Please include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your full name and contact details (email + phone).</li>
              <li>A clear description of the grievance.</li>
              <li>The specific URL(s), facility code(s), or data points involved.</li>
              <li>Any supporting evidence (screenshots, regulator documents, proof of identity where relevant).</li>
              <li>The outcome you seek — correction, removal, access to data, etc.</li>
            </ul>
            <p>
              For data-principal requests (DPDP Act rights), please provide sufficient identification so that we can match the request
              to your data without ambiguity.
            </p>
          </Section>

          <Section title="4. Timelines">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">Acknowledgement</p>
                  <p className="text-2xl font-bold text-emerald-400">24 hours</p>
                  <p className="text-zinc-500 mt-1">We will confirm receipt of your grievance within one business day.</p>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">Content / IT Rules resolution</p>
                  <p className="text-2xl font-bold text-emerald-400">15 days</p>
                  <p className="text-zinc-500 mt-1">As required under Rule 3(2)(a) of IT Rules 2021.</p>
                </div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">DPDP Act request</p>
                  <p className="text-2xl font-bold text-emerald-400">30 days</p>
                  <p className="text-zinc-500 mt-1">Unless a lesser statutory period applies to the specific right exercised.</p>
                </div>
              </div>
            </div>
            <p>
              For unlawful content involving sexual acts, child sexual abuse material, or impersonation, we will act within 24 hours of
              a valid complaint, as required under Rule 3(2)(b) of IT Rules 2021.
            </p>
          </Section>

          <Section title="5. Escalation">
            <p>
              If you are unsatisfied with the response from our Grievance Officer, you may escalate the matter as follows:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Data Protection Board of India</strong> — for DPDP-Act-related grievances not satisfactorily resolved.
              </li>
              <li>
                <strong>Grievance Appellate Committee</strong> — under Rule 3A of IT Rules 2021, for appeals against the intermediary&apos;s
                decision.
              </li>
              <li>
                <strong>Cyber Crime reporting</strong> — for suspected cyber-crime or fraud, you may report to the National Cyber Crime
                Reporting Portal at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">cybercrime.gov.in</a>.
              </li>
              <li>
                <strong>Consumer grievance</strong> — the National Consumer Helpline at <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">consumerhelpline.gov.in</a>.
              </li>
            </ul>
          </Section>

          <Section title="6. Records">
            <p>
              We maintain a record of each grievance including the date of receipt, nature of the grievance, action taken, and the date
              of resolution. A monthly compliance summary is published where required under law. Nothing in this policy limits any
              right you have to approach a court of competent jurisdiction.
            </p>
          </Section>

          <Section title="7. Related documents">
            <ul className="list-disc pl-6 space-y-1">
              <li><Link href="/terms" className="text-emerald-400 underline">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-emerald-400 underline">Privacy Policy</Link></li>
            </ul>
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
