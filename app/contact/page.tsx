// app/contact/page.tsx
import { Copyable } from "./Copyable";

export const metadata = { title: "Contact Us — Rotehügels" };

export default function ContactPage() {
  return (
    <main className="mt-10 px-4">
      {/* Title */}
      <h1 className="text-center text-3xl font-bold">
        Contact Us
        <span className="block mx-auto mt-2 h-[2px] w-20 rounded-full bg-gradient-to-r from-rose-500 to-rose-300"></span>
      </h1>

      <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-white/80">
        Our regional teams operate across three strategic time zones to ensure seamless 24-hour global engagement.
      </p>

      {/* Regions */}
      <section
        aria-label="Regional contacts"
        className="mx-auto mt-8 grid max-w-6xl auto-rows-fr gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      >
        {/* APAC — Chennai */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all duration-300">
          <h3 className="text-xl font-semibold text-rose-300">
            Asia–Pacific (APAC)
            <br />
            <span className="text-white/80 text-base">Chennai, India</span>
          </h3>
          <p className="mt-1 text-xs text-white/70">IST (UTC+5:30) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="apac@rotehuegels.com"
              href="mailto:apac@rotehuegels.com?subject=%5BAPAC%5D%20Enquiry"
              ariaLabel="Email APAC"
            />
            <Copyable
              label="📱"
              value="🇮🇳 +91 89391 20320"
              href="tel:+918939120320"
              ariaLabel="Call APAC phone"
            />
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Corporate HQ · R&amp;D · Engineering · EPC · Asia-Pacific Client Engagement</p>
          </div>
        </div>

        {/* EMEA — Kitwe */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all duration-300">
          <h3 className="text-xl font-semibold text-rose-300">
            Europe, Middle East &amp; Africa (EMEA)
            <br />
            <span className="text-white/80 text-base">Kitwe, Zambia</span>
          </h3>
          <p className="mt-1 text-xs text-white/70">CAT (UTC+2) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="emea@rotehuegels.com"
              href="mailto:emea@rotehuegels.com?subject=%5BEMEA%5D%20Enquiry"
              ariaLabel="Email EMEA"
            />
            <Copyable
              label="📱"
              value="🇿🇲 +260 77354 0064"
              href="tel:+260773540064"
              ariaLabel="Call EMEA phone"
            />
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Sales &amp; Marketing support across Africa and Europe, coordinated via Chennai and Dallas.</p>
          </div>
        </div>

        {/* Americas — Dallas */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all duration-300">
          <h3 className="text-xl font-semibold text-rose-300">
            North, Central &amp; South America
            <br />
            <span className="text-white/80 text-base">Dallas, USA</span>
          </h3>
          <p className="mt-1 text-xs text-white/70">CST (UTC−6) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="americas@rotehuegels.com"
              href="mailto:americas@rotehuegels.com?subject=%5BAmericas%5D%20Enquiry"
              ariaLabel="Email Americas"
            />
            <Copyable
              label="📱"
              value="🇺🇸 +1 847 778 7595"
              href="tel:+18477787595"
              ariaLabel="Call Americas phone"
            />
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Client acquisition · Partnership development · Investor relations across the Americas.</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="mx-auto my-10 max-w-6xl border-white/10" />

      {/* Territory Allocation */}
      <section className="mx-auto max-w-6xl" aria-label="Territory allocation">
        <h3 className="text-lg font-semibold text-center md:text-left">Territory Allocation</h3>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-rose-950/30 to-rose-900/10 p-4 shadow-inner">
            <p className="font-medium text-rose-200">APAC</p>
            <p className="opacity-90">
              India, South Asia, Southeast Asia, East Asia, Central Asia, Middle East, Oceania
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-rose-950/30 to-rose-900/10 p-4 shadow-inner">
            <p className="font-medium text-rose-200">EMEA &amp; Americas</p>
            <p className="opacity-90">All African &amp; European countries; North, Central &amp; South America</p>
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

          {/* Sales & Marketing (Technical) */}
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

      {/* Global email shortcuts */}
      <section className="mx-auto mt-10 max-w-3xl text-center" aria-label="Global contacts">
        <p className="text-white/80">Prefer email? Choose the right address:</p>
        <div className="mt-3 space-y-1">
          <p>
            General Enquiries:{" "}
            <a className="text-rose-300 underline-offset-4 hover:underline" href="mailto:info@rotehuegels.com">
              info@rotehuegels.com
            </a>{" "}
            <span className="text-white/60">· General Communications</span>
          </p>
          <p>
            RFPs / Scope Notes:{" "}
            <a className="text-rose-300 underline-offset-4 hover:underline" href="mailto:sales@rotehuegels.com">
              sales@rotehuegels.com
            </a>{" "}
            <span className="text-white/60">· Sales Inquiries</span>
          </p>
          <p>
            Investor Relations:{" "}
            <a className="text-rose-300 underline-offset-4 hover:underline" href="mailto:ir@rotehuegels.com">
              ir@rotehuegels.com
            </a>
          </p>
        </div>
        <p className="mt-6 text-xs text-white/60">We do not share client details. NDAs available on request.</p>
      </section>
    </main>
  );
}