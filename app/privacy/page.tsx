import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Rotehügels',
  description: 'How Rotehügels collects, uses, shares, and protects personal data under the Digital Personal Data Protection Act, 2023.',
};

const LAST_UPDATED = '19 April 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-10 text-xs text-amber-300/90">
          <p>
            <strong>Draft for counsel review.</strong> This policy reflects our current data-handling practices and is aligned with the
            Digital Personal Data Protection Act, 2023 (DPDP Act). It will be reviewed by qualified Indian counsel before a material
            public launch.
          </p>
        </div>

        <section className="space-y-6 text-sm text-zinc-300 leading-relaxed">

          <Section title="1. Who we are">
            <p>
              This Privacy Policy is issued by <strong className="text-white">Rotehuegel Research Business Consultancy Private
              Limited</strong> (&ldquo;Rotehügels&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), a private company incorporated
              under the laws of India with its registered office at Chennai, Tamil Nadu – 600052. For the purposes of the Digital
              Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;), we are a Data Fiduciary in respect of personal data that we
              determine the purpose and means of processing.
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p>We process the following broad categories of data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Publicly-sourced facility information</strong> — company names, registered / plant addresses, GPS coordinates,
                authorisation numbers, capacity figures, category classifications. Sourced from CPCB, SPCB, MoEF registries, BSE/NSE
                filings, credit-rating-agency disclosures, and company websites. See{' '}
                <Link href="/data-sources" className="text-emerald-400 underline">/data-sources</Link>.
              </li>
              <li>
                <strong>Contact details of named individuals</strong> associated with listed facilities — email addresses, phone
                numbers, and occasionally names of directors / key contacts. This is personal data under the DPDP Act and is held
                <strong className="text-white"> only behind authenticated access</strong> (our internal dashboard at <code>/d/</code>). It is not
                published on the public Directory pages at <Link href="/ecosystem" className="text-emerald-400 underline">/ecosystem</Link>.
              </li>
              <li>
                <strong>Registration and form submissions</strong> — when you register as a customer, supplier, recycler, or REX
                Network member, or submit a pickup / quote request, we collect the information you provide (name, company, email,
                phone, address, waste-stream details, etc.).
              </li>
              <li>
                <strong>Visitor analytics</strong> — IP address (truncated), country / city (via Vercel edge), user-agent,
                pages visited, referral source, UTM parameters, and a session-scoped visitor ID. Used to understand traffic patterns
                and detect abuse.
              </li>
              <li>
                <strong>Account data</strong> — for registered dashboard users, your email, hashed password, role, and audit log of key
                actions.
              </li>
            </ul>
          </Section>

          <Section title="3. Why we process it (purposes)">
            <ul className="list-disc pl-6 space-y-1">
              <li>To build and maintain the Ecosystem Directory.</li>
              <li>To connect waste generators with authorised recyclers and other facilities.</li>
              <li>To process pickup / quote / registration requests you submit.</li>
              <li>To operate the marketplace feature when live (matching buy / sell listings).</li>
              <li>To communicate with you about our services (including transactional and service-related emails).</li>
              <li>To comply with statutory, regulatory, and lawful obligations.</li>
              <li>To detect, prevent, and investigate fraud, abuse, or security incidents.</li>
              <li>For analytics and service improvement.</li>
            </ul>
          </Section>

          <Section title="4. Legal basis (DPDP Act)">
            <p>We rely on the following lawful bases:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Your consent</strong> (Section 6 DPDP Act) — for processing the personal data you provide in registration
                forms, marketplace listings, or pickup / quote requests. You may withdraw consent at any time via the contact at
                the end of this policy.
              </li>
              <li>
                <strong>Legitimate uses under Section 7 DPDP Act</strong> — including voluntary provision of data, employment, legal
                obligations, and medical / emergency exceptions where applicable.
              </li>
              <li>
                <strong>Publicly available facility data</strong> — personal data that has been made public by the data principal or
                under a statutory obligation (for example, names and addresses listed in CPCB / SPCB authorisation orders) is outside
                the scope of DPDP consent requirements (Section 3(c)(ii) DPDP Act).
              </li>
            </ul>
          </Section>

          <Section title="5. Who we share data with">
            <p>We do not sell personal data. We share it only with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Connected facilities</strong> — when you request a pickup, quote, or marketplace match, we share the relevant
                details (name, contact, material description) with the facility you are being connected to.
              </li>
              <li>
                <strong>Statutory authorities</strong> — where required by law, court order, or lawful request from a regulator.
              </li>
              <li>
                <strong>Service providers</strong> — hosting (Vercel, Supabase), email (Microsoft 365, Nodemailer SMTP), analytics,
                AI inference (Groq, Ollama, Anthropic via approved API access), GSTIN verification (<em>gstincheck.co.in</em>),
                search providers (Bing Web Search, Claude Web Search). These providers process data only as instructed by us under
                contractual data-processing terms.
              </li>
              <li>
                <strong>Corporate events</strong> — if Rotehügels undergoes a merger, acquisition, or asset sale, personal data may be
                transferred to the successor entity, subject to this policy or equivalent protections.
              </li>
            </ul>
          </Section>

          <Section title="6. Retention">
            <p>
              We retain personal data only for as long as necessary to fulfil the purpose for which it was collected, to comply with
              legal obligations, or to resolve disputes. Registration records are retained for the duration of your account plus a
              reasonable post-closure audit period (typically seven financial years, per tax / statutory norms). Visitor analytics are
              retained in aggregated form for up to 24 months. You may request earlier deletion subject to our legal retention needs.
            </p>
          </Section>

          <Section title="7. Security">
            <p>We use industry-standard safeguards including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>HTTPS with a 2-year HSTS + preload policy.</li>
              <li>Encrypted at-rest storage (AES-256-GCM on our Supabase Postgres instance).</li>
              <li>Row-Level-Security enforcing authenticated-only access to internal tables.</li>
              <li>Session tokens signed with HMAC-SHA-512 and rotated credentials.</li>
              <li>Strict separation of anon-key (public aggregates) and service-role (server-side) database access.</li>
              <li>Security headers including X-Frame-Options, Content-Security-Policy directives, Cross-Origin-Opener-Policy, and Cross-Origin-Resource-Policy.</li>
              <li>Regular security audits and prompt patching of identified vulnerabilities.</li>
            </ul>
            <p>
              No system is perfectly secure. In the event of a personal-data breach likely to cause material harm, we will notify the
              Data Protection Board of India and affected data principals as required under the DPDP Act.
            </p>
          </Section>

          <Section title="8. Your rights (Data Principal rights under Section 11–14 DPDP Act)">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access / confirmation</strong> — request a summary of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete personal data.</li>
              <li><strong>Erasure</strong> — ask us to delete your personal data, subject to legal retention requirements.</li>
              <li><strong>Nomination</strong> — nominate another individual to exercise your rights in the event of your death or incapacity.</li>
              <li><strong>Grievance redressal</strong> — raise a grievance via our Grievance Officer (see Section 11).</li>
              <li><strong>Withdraw consent</strong> — withdraw previously-given consent at any time, with effect for future processing.</li>
            </ul>
            <p>
              To exercise any right, write to <a href="mailto:privacy@rotehuegels.com" className="text-emerald-400 underline">
              privacy@rotehuegels.com</a> with sufficient detail to allow us to identify you and the data in question. We will respond
              within 30 days.
            </p>
          </Section>

          <Section title="9. Children's data">
            <p>
              The Platform is not directed at children under the age of 18. We do not knowingly collect personal data of children. If
              you believe we hold such data, please contact us and we will delete it.
            </p>
          </Section>

          <Section title="10. Cross-border transfers">
            <p>
              Our hosting (Vercel), database (Supabase), and some AI-inference providers may process data outside India. Where
              transfers occur, we rely on our contractual data-processing terms with those providers to ensure protection consistent
              with this policy. The Government of India may from time to time notify a list of countries to which personal data may
              not be transferred; we will comply with such notifications.
            </p>
          </Section>

          <Section title="11. Grievance Officer">
            <p>
              In accordance with Section 11 of the DPDP Act and Rule 3(11) of the Information Technology (Intermediary Guidelines and
              Digital Media Ethics Code) Rules, 2021, our Grievance Officer is:
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs">
              <p><strong className="text-white">Mr. Sivakumar Shanmugam</strong></p>
              <p>Founder &amp; Director, Rotehuegel Research Business Consultancy Private Limited</p>
              <p>Registered office: Chennai, Tamil Nadu – 600052, India</p>
              <p>Email: <a href="mailto:grievance@rotehuegels.com" className="text-emerald-400 underline">grievance@rotehuegels.com</a></p>
            </div>
            <p>See our <Link href="/grievance" className="text-emerald-400 underline">Grievance Redressal Policy</Link> for timelines and escalation.</p>
          </Section>

          <Section title="12. Cookies">
            <p>
              We use a small number of strictly-necessary cookies (session authentication, CSRF protection) and a session-scoped
              visitor ID for analytics. We do not use third-party advertising cookies. You can block cookies in your browser, but
              some features (such as signing in to the dashboard) will not work without them.
            </p>
          </Section>

          <Section title="13. Changes">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be notified on this page with a revised &ldquo;last
              updated&rdquo; date. Continued use of the Platform after such changes constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              For any privacy-related query, write to{' '}
              <a href="mailto:privacy@rotehuegels.com" className="text-emerald-400 underline">privacy@rotehuegels.com</a> or by post to
              the registered office.
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
