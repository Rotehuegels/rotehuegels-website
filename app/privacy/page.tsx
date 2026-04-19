import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Rotehügels',
  description: 'How Rotehügels collects, uses, and protects personal data under the Digital Personal Data Protection Act, 2023.',
};

const LAST_UPDATED = '19 April 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <section className="max-w-4xl space-y-6 text-sm text-zinc-300 leading-relaxed">

          <Section title="1. Who we are">
            <p>
              This Privacy Policy is issued by <strong className="text-white">Rotehuegel Research Business Consultancy Private Limited</strong>
              {' '}(&ldquo;Rotehügels&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), a company incorporated under the laws of
              India with registered office at Chennai, Tamil Nadu – 600052. For the purposes of the Digital Personal Data Protection
              Act, 2023 (&ldquo;DPDP Act&rdquo;), we are a Data Fiduciary in respect of personal data we process.
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p>We process the following categories of data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Publicly-sourced facility information (company names, addresses, authorisation and capacity data) from government registries and other public sources.</li>
              <li>Personal contact details of individuals associated with listed facilities. Held behind authenticated access; not published on the public directory.</li>
              <li>Information you provide when you register, submit a form, post a marketplace listing, or contact us.</li>
              <li>Basic visitor analytics (approximate location, device type, pages visited) used to understand traffic and detect abuse.</li>
              <li>Account data for registered dashboard users.</li>
            </ul>
          </Section>

          <Section title="3. Why we process it">
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, maintain, and improve our services.</li>
              <li>To respond to requests and connect users with relevant facilities.</li>
              <li>To communicate service-related information.</li>
              <li>To comply with legal and regulatory obligations.</li>
              <li>To detect, prevent, and investigate fraud or abuse.</li>
            </ul>
          </Section>

          <Section title="4. Legal basis (DPDP Act)">
            <ul className="list-disc pl-6 space-y-1">
              <li>Your consent (Section 6) for personal data you provide to us.</li>
              <li>Legitimate uses under Section 7 where applicable.</li>
              <li>Information already made public by the data principal or under statutory obligation falls outside DPDP consent requirements under Section 3(c)(ii).</li>
            </ul>
          </Section>

          <Section title="5. Who we share data with">
            <p>We do not sell personal data. We share it only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Parties with whom you have asked us to connect you.</li>
              <li>Service providers who process data on our behalf, under contractual confidentiality obligations.</li>
              <li>Statutory authorities where required by law.</li>
              <li>A successor entity in the event of a merger, acquisition, or asset sale, subject to equivalent protections.</li>
            </ul>
          </Section>

          <Section title="6. Retention">
            <p>
              We retain personal data only for as long as necessary to fulfil the purpose for which it was collected, to comply with
              legal obligations, or to resolve disputes.
            </p>
          </Section>

          <Section title="7. Security">
            <p>
              We implement reasonable technical and organisational safeguards to protect personal data against unauthorised access,
              alteration, disclosure, loss, or destruction. In the event of a personal-data breach likely to cause material harm, we
              will notify the Data Protection Board of India and affected data principals as required under the DPDP Act.
            </p>
          </Section>

          <Section title="8. Your rights under the DPDP Act">
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, correction, and erasure of your personal data.</li>
              <li>Nomination of another individual to exercise your rights.</li>
              <li>Withdrawal of previously-given consent.</li>
              <li>Grievance redressal via our Grievance Officer.</li>
            </ul>
            <p>
              To exercise any right, write to{' '}
              <a href="mailto:privacy@rotehuegels.com" className="text-emerald-400 underline">privacy@rotehuegels.com</a>.
            </p>
          </Section>

          <Section title="9. Children's data">
            <p>
              The Platform is not directed at children under 18. We do not knowingly collect personal data of children.
            </p>
          </Section>

          <Section title="10. Cross-border transfers">
            <p>
              Some of our service providers may process data on servers located outside India. We comply with any restriction on
              cross-border transfers notified by the Government of India.
            </p>
          </Section>

          <Section title="11. Grievance Officer">
            <p>
              Under Section 11 of the DPDP Act and Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media
              Ethics Code) Rules, 2021, our Grievance Officer may be reached at{' '}
              <a href="mailto:grievance@rotehuegels.com" className="text-emerald-400 underline">grievance@rotehuegels.com</a>.
              See the <Link href="/grievance" className="text-emerald-400 underline">Grievance Redressal Policy</Link> for timelines.
            </p>
          </Section>

          <Section title="12. Changes">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be notified on this page with a revised &ldquo;last
              updated&rdquo; date.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For any privacy-related query, write to{' '}
              <a href="mailto:privacy@rotehuegels.com" className="text-emerald-400 underline">privacy@rotehuegels.com</a>.
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
