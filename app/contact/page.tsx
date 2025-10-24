import Copyable from "./Copyable";

export const metadata = { title: "Contact Us — Rotehügels" };

export default function ContactPage() {
  return (
    <main className="mt-10 px-4">
      <h1 className="text-center text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-center opacity-80">
        Our regional teams operate across three strategic time zones to ensure seamless 24-hour global engagement.
      </p>

      {/* Three Regional Cards */}
      <section className="mx-auto mt-8 grid max-w-6xl auto-rows-fr gap-6 md:grid-cols-3">
        {/* APAC */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-rose-950/20 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-rose-400">Asia–Pacific (APAC)</h3>
          <p className="text-sm text-white/80">Chennai, India</p>
          <p className="mt-1 text-xs opacity-70">IST (UTC+5:30) • 08:00–18:00</p>
          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="apac@rotehuegels.com"
              href="mailto:apac@rotehuegels.com"
              ariaLabel="Email APAC"
            />
            <Copyable
              label="🇮🇳"
              value="+91 89391 20320"
              href="tel:+918939120320"
              ariaLabel="Call APAC"
            />
          </div>
          <div className="mt-4 text-sm opacity-90">
            <p>Functions</p>
            <p>Corporate HQ · R&amp;D · Engineering · EPC · Asia-Pacific Client Engagement</p>
          </div>
        </div>

        {/* EMEA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-rose-950/20 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-rose-400">Europe, Middle East &amp; Africa (EMEA)</h3>
          <p className="text-sm text-white/80">Kitwe, Zambia</p>
          <p className="mt-1 text-xs opacity-70">CAT (UTC+2) • 08:00–18:00</p>
          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="emea@rotehuegels.com"
              href="mailto:emea@rotehuegels.com"
              ariaLabel="Email EMEA"
            />
            <Copyable
              label="🇿🇲"
              value="+260 77354 0064"
              href="tel:+260773540064"
              ariaLabel="Call EMEA"
            />
          </div>
          <div className="mt-4 text-sm opacity-90">
            <p>Functions</p>
            <p>Sales &amp; Marketing support across Africa and Europe, coordinated via Chennai and Dallas.</p>
          </div>
        </div>

        {/* Americas */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-rose-950/20 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-rose-400">North, Central &amp; South America</h3>
          <p className="text-sm text-white/80">Dallas, USA</p>
          <p className="mt-1 text-xs opacity-70">CST (UTC−6) • 08:00–18:00</p>
          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="americas@rotehuegels.com"
              href="mailto:americas@rotehuegels.com"
              ariaLabel="Email Americas"
            />
            <Copyable
              label="🇺🇸"
              value="+1 847 778 7595"
              href="tel:+18477787595"
              ariaLabel="Call Americas"
            />
          </div>
          <div className="mt-4 text-sm opacity-90">
            <p>Functions</p>
            <p>Client acquisition · Partnership development · Investor relations across the Americas.</p>
          </div>
        </div>
      </section>

      {/* Territory Allocation */}
      <section className="mx-auto mt-8 max-w-6xl">
        <h3 className="text-lg font-semibold text-center md:text-left">Territory Allocation</h3>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-rose-950/20 p-4">
            <p className="font-semibold text-white">APAC</p>
            <p className="text-sm opacity-80">
              India, South Asia, Southeast Asia, East Asia, Central Asia, Middle East, Oceania
            </p>
          </div>
          <div className="rounded-2xl bg-rose-950/20 p-4">
            <p className="font-semibold text-white">EMEA &amp; Americas</p>
            <p className="text-sm opacity-80">
              All African &amp; European countries; North, Central &amp; South America
            </p>
          </div>
        </div>
      </section>

      {/* Key Contacts */}
      <section className="mx-auto mt-10 max-w-6xl" aria-label="Key contacts">
        <h3 className="text-lg font-semibold text-center md:text-left">Key Contacts</h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {/* CEO */}
          <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20">
            <p className="text-xl font-semibold text-white">Mr. Sivakumar Shanmugam</p>
            <p className="text-sm text-white/70">Founder &amp; CEO</p>
            <div className="mt-3 space-y-1">
              <Copyable
                label="📧"
                value="ceo@rotehuegels.com"
                href="mailto:ceo@rotehuegels.com?subject=%5BCEO%5D%20Enquiry"
                ariaLabel="Email CEO"
              />
            </div>
            <p className="mt-2">
              <a
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.linkedin.com/in/sivakumarshanmugam"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">🔗</span> LinkedIn — Sivakumar Shanmugam
              </a>
            </p>
          </div>

          {/* Sales & Marketing */}
          <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20">
            <p className="text-xl font-semibold text-white">Ms. Vaishnavi Elumalai</p>
            <p className="text-sm text-white/70">Sales &amp; Marketing (Technical)</p>
            <div className="mt-3 space-y-1">
              <Copyable
                label="📧"
                value="vaishnavi@rotehuegels.com"
                href="mailto:vaishnavi@rotehuegels.com?subject=%5BKey%20Contact%5D%20Enquiry"
                ariaLabel="Email Vaishnavi"
              />
            </div>
            <p className="mt-2">
              <a
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">🔗</span> LinkedIn — Vaishnavi Elumalai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Email CTA */}
      <section className="mx-auto mt-10 max-w-3xl text-center">
        <p className="opacity-90">Prefer email? Choose the right address:</p>
        <div className="mt-3 space-y-1">
          <p>
            General Enquiries:{" "}
            <a className="text-rose-400 hover:underline" href="mailto:info@rotehuegels.com">
              info@rotehuegels.com
            </a>{" "}
            <span className="text-xs opacity-70">(General Communications)</span>
          </p>
          <p>
            RFPs / Sales Inquiries:{" "}
            <a className="text-rose-400 hover:underline" href="mailto:sales@rotehuegels.com">
              sales@rotehuegels.com
            </a>{" "}
            <span className="text-xs opacity-70">(RFPs / Proposals)</span>
          </p>
          <p>
            Investor Relations:{" "}
            <a className="text-rose-400 hover:underline" href="mailto:ir@rotehuegels.com">
              ir@rotehuegels.com
            </a>
          </p>
        </div>
        <p className="mt-3 text-xs opacity-60">We do not share client details. NDAs available on request.</p>
      </section>
    </main>
  );
}