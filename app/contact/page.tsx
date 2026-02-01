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

      {/* Territory Allocation */}
      <section className="mx-auto mt-10 max-w-6xl">
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
            <p className="opacity-90">
              All African &amp; European countries; North, Central &amp; South America
            </p>
          </div>
        </div>
      </section>

      {/* Key Contacts */}
      <section className="mx-auto mt-10 max-w-6xl" aria-label="Key contacts">
        <h3 className="text-lg font-semibold text-center md:text-left">Key Contacts</h3>

        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {/* CEO */}
          <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20">
            <p className="text-xl font-semibold text-white">Mr. Sivakumar Shanmugam</p>
            <p className="text-sm text-white/70">Founder &amp; CEO</p>
            <p className="mt-1 text-xs text-white/60">📍 Chennai, Tamil Nadu, India</p>

            <div className="mt-3 space-y-1">
              <Copyable
                label="📧"
                value="sivakumar@rotehuegels.com"
                href="mailto:sivakumar@rotehuegels.com?subject=%5BCEO%5D%20Enquiry"
                ariaLabel="Email CEO"
              />
              <Copyable
                label="📱"
                value="+91 89391 20320"
                href="tel:+918939120320"
                ariaLabel="Call CEO"
              />
            </div>

            <p className="mt-2">
              <a
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.linkedin.com/in/sivakumarshanmugam"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 LinkedIn — Sivakumar Shanmugam
              </a>
            </p>
          </div>

          {/* CFO */}
          <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20">
            <p className="text-xl font-semibold text-white">Ms. Aishwarya Govindharajan</p>
            <p className="text-sm text-white/70">
              Global CFO &amp; Business Investment Strategist
            </p>
            <p className="mt-1 text-xs text-white/60">📍 Singapore</p>

            <div className="mt-3 space-y-1">
              <Copyable
                label="📧"
                value="aishwarya@rotehuegels.com"
                href="mailto:aishwarya@rotehuegels.com?subject=%5BCFO%5D%20Enquiry"
                ariaLabel="Email CFO"
              />
              <Copyable
                label="📱"
                value="+65 8225 8403"
                href="tel:+6582258403"
                ariaLabel="Call CFO"
              />
            </div>

            <p className="mt-2">
              <a
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.linkedin.com/in/aishwarya-govindharajan-b519981b/"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 LinkedIn — Aishwarya Govindharajan
              </a>
            </p>
          </div>

          {/* Sales */}
          <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20">
            <p className="text-xl font-semibold text-white">Ms. Vaishnavi Elumalai</p>
            <p className="text-sm text-white/70">Sales &amp; Marketing (Technical)</p>
            <p className="mt-1 text-xs text-white/60">📍 Irving, Texas, USA</p>

            <div className="mt-3 space-y-1">
              <Copyable
                label="📧"
                value="vaishnavi@rotehuegels.com"
                href="mailto:vaishnavi@rotehuegels.com?subject=%5BSales%5D%20Enquiry"
                ariaLabel="Email Sales"
              />
              <Copyable
                label="📱"
                value="+1 847 778 7595"
                href="tel:+18477787595"
                ariaLabel="Call Sales"
              />
            </div>

            <p className="mt-2">
              <a
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 LinkedIn — Vaishnavi Elumalai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Global emails */}
      <section className="mx-auto mt-12 max-w-3xl text-center">
        <p className="text-white/80">Prefer email? Choose the right address:</p>
        <div className="mt-3 space-y-1">
          <p>
            General Enquiries:{" "}
            <a className="text-rose-300 hover:underline" href="mailto:info@rotehuegels.com">
              info@rotehuegels.com
            </a>{" "}
            <span className="text-white/60">· General Communications</span>
          </p>
          <p>
            RFPs / Scope Notes:{" "}
            <a className="text-rose-300 hover:underline" href="mailto:sales@rotehuegels.com">
              sales@rotehuegels.com
            </a>{" "}
            <span className="text-white/60">· Sales Inquiries</span>
          </p>
          <p>
            Investor Relations:{" "}
            <a className="text-rose-300 hover:underline" href="mailto:ir@rotehuegels.com">
              ir@rotehuegels.com
            </a>
          </p>
        </div>

        <p className="mt-6 text-xs text-white/60">
          We do not share client details. NDAs available on request.
        </p>
      </section>
    </main>
  );
}