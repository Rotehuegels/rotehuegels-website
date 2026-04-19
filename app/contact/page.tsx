import { Copyable } from "./Copyable";
import { ContactForm } from "./ContactForm";

export const metadata = { title: "Contact Us — Rotehügels" };

export default function ContactPage() {
  return (
    <main className="mt-10 px-4">
      {/* Title */}
      <h1 className="text-center text-3xl font-bold">
        Contact Us
        <span className="block mx-auto mt-2 h-[2px] w-20 rounded-full bg-gradient-to-r from-rose-500 to-rose-300"></span>
      </h1>

      <p className="mx-auto mt-4 max-w-[1800px] text-center text-sm text-white/80">
        Our regional teams operate across three strategic time zones to ensure seamless
        24-hour global engagement.
      </p>

      {/* Contact Form */}
      <section
        aria-label="Send us a message"
        className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/30"
      >
        <h2 className="mb-1 text-xl font-semibold">Send us a message</h2>
        <p className="mb-6 text-sm text-white/50">
          Fill in the form and the right team will get back to you within one business day.
        </p>
        <ContactForm />
      </section>

      <div className="mx-auto mt-12 max-w-[1800px]">
        <p className="mb-6 text-center text-sm text-white/50 uppercase tracking-widest font-medium">
          Or reach us directly
        </p>
      </div>

      {/* Regions */}
      <section
        aria-label="Regional contacts"
        className="mx-auto mt-8 grid max-w-[1800px] auto-rows-fr gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      >
        {/* APAC */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all">
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
              href="mailto:apac@rotehuegels.com"
            />
            <Copyable
              label="📱"
              value="🇮🇳 +91 89391 20320"
              href="tel:+918939120320"
            />
          </div>

          <p className="mt-4 text-sm opacity-90">
            Corporate HQ · R&D · Engineering · EPC · Asia-Pacific Client Engagement
          </p>
        </div>

        {/* EMEA */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all">
          <h3 className="text-xl font-semibold text-rose-300">
            Europe, Middle East & Africa (EMEA)
            <br />
            <span className="text-white/80 text-base">Kitwe, Zambia</span>
          </h3>
          <p className="mt-1 text-xs text-white/70">CAT (UTC+2) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="emea@rotehuegels.com"
              href="mailto:emea@rotehuegels.com"
            />
            <Copyable
              label="📱"
              value="🇿🇲 +260 97354 0064"
              href="tel:+260973540064"
            />
          </div>

          <p className="mt-4 text-sm opacity-90">
            Sales & Marketing support across Africa and Europe, coordinated globally.
          </p>
        </div>

        {/* Americas */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all">
          <h3 className="text-xl font-semibold text-rose-300">
            North, Central & South America
            <br />
            <span className="text-white/80 text-base">Dallas, USA</span>
          </h3>
          <p className="mt-1 text-xs text-white/70">CST (UTC−6) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <Copyable
              label="📧"
              value="americas@rotehuegels.com"
              href="mailto:americas@rotehuegels.com"
            />
            <Copyable
              label="📱"
              value="🇺🇸 +1 847 778 7595"
              href="tel:+18477787595"
            />
          </div>

          <p className="mt-4 text-sm opacity-90">
            Client acquisition · Partnerships · Investor relations across the Americas.
          </p>
        </div>
      </section>

      {/* Divider */}
      <hr className="mx-auto my-10 max-w-[1800px] border-white/10" />

      {/* Key Contacts */}
      <section className="mx-auto max-w-[1800px]" aria-label="Key contacts">
        <h3 className="text-lg font-semibold">Key Contacts</h3>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {/* CEO */}
          <div className="rounded-2xl bg-white/5 p-6">
            <p className="text-xl font-semibold">Mr. Sivakumar Shanmugam</p>
            <p className="text-sm text-white/70">Founder & CEO</p>
            <p className="mt-1 text-xs text-white/60">
              Strategic leadership, technology direction, and global execution oversight.
            </p>
            <p className="mt-2 text-xs text-white/60">🇮🇳 Chennai, Tamil Nadu, India</p>

            <div className="mt-3 space-y-1">
              <Copyable label="📧" value="sivakumar@rotehuegels.com" href="mailto:sivakumar@rotehuegels.com" />
              <Copyable label="📱" value="+91 89391 20320" href="tel:+918939120320" />
            </div>

            <a
              className="mt-2 inline-block underline-offset-4 hover:underline"
              href="https://www.linkedin.com/in/sivakumarshanmugam"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 LinkedIn — Sivakumar Shanmugam
            </a>
          </div>

          {/* CFO */}
          <div className="rounded-2xl bg-white/5 p-6">
            <p className="text-xl font-semibold">Ms. Aishwarya Govindharajan</p>
            <p className="text-sm text-white/70">
              Senior Consultant (Independent)
            </p>
            <p className="mt-1 text-xs text-white/60">
              Capital strategy, financial governance, and global investment structuring.
            </p>
            <p className="mt-2 text-xs text-white/60">🇸🇬 Singapore</p>

            <div className="mt-3 space-y-1">
              <Copyable label="📧" value="aishwarya@rotehuegels.com" href="mailto:aishwarya@rotehuegels.com" />
              <Copyable label="📱" value="+65 8225 8403" href="tel:+6582258403" />
            </div>

            <a
              className="mt-2 inline-block underline-offset-4 hover:underline"
              href="https://www.linkedin.com/in/aishwarya-govindharajan-b519981b/"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 LinkedIn — Aishwarya Govindharajan
            </a>
          </div>

          {/* CMO */}
          <div className="rounded-2xl bg-white/5 p-6">
            <p className="text-xl font-semibold">Ms. Vaishnavi Elumalai</p>
            <p className="text-sm text-white/70">
              Chief Marketing Officer (CMO)
            </p>
            <p className="mt-1 text-xs text-white/60">
              Global Sales, Marketing & Client Partnerships.
            </p>
            <p className="mt-2 text-xs text-white/60">🇺🇸 Irving, Texas, USA</p>

            <div className="mt-3 space-y-1">
              <Copyable label="📧" value="vaishnavi@rotehuegels.com" href="mailto:vaishnavi@rotehuegels.com" />
              <Copyable label="📱" value="+1 847 778 7595" href="tel:+18477787595" />
            </div>

            <a
              className="mt-2 inline-block underline-offset-4 hover:underline"
              href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 LinkedIn — Vaishnavi Elumalai
            </a>
          </div>
        </div>
      </section>

      {/* Global Emails */}
      <section className="mx-auto mt-10 max-w-[1800px] text-center">
        <p className="text-white/80">Prefer email? Choose the right address:</p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            General Enquiries:{" "}
            <a className="text-rose-300 hover:underline" href="mailto:info@rotehuegels.com">
              info@rotehuegels.com
            </a>{" "}
            · General Communications
          </p>
          <p>
            RFPs / Scope Notes:{" "}
            <a className="text-rose-300 hover:underline" href="mailto:sales@rotehuegels.com">
              sales@rotehuegels.com
            </a>{" "}
            · Sales Inquiries
          </p>
          <p>
            Investor Relations:{" "}
            <a className="text-rose-300 hover:underline" href="mailto:ir@rotehuegels.com">
              ir@rotehuegels.com
            </a>
          </p>
        </div>

        <p className="mt-6 text-xs text-white/60 leading-relaxed">
          <strong className="text-white/70">Confidentiality & IP Protection:</strong>{" "}
          Rotehügels follows strict confidentiality and data-protection practices to
          safeguard client intellectual property, proprietary processes, and technology
          know-how. All engagements are governed by confidentiality obligations, with NDAs
          executed wherever required.
        </p>
      </section>
    </main>
  );
}