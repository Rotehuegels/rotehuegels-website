// app/contact/page.tsx
"use client";

import { useState } from "react";

export const metadata = { title: "Contact Us — Rotehuegels" };

// Small helper for click-to-copy lines
function Copyable({
  label,
  value,
  href,
  ariaLabel,
}: {
  label: string; // emoji or icon
  value: string; // display text
  href?: string; // tel: or mailto:
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, " "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  const line = (
    <span className="underline-offset-4 hover:underline">
      {value}
    </span>
  );

  return (
    <p className="flex items-center gap-2">
      <span aria-hidden="true">{label}</span>
      {href ? (
        <a
          href={href}
          aria-label={ariaLabel || value}
          className="focus:outline-none focus:ring-2 focus:ring-rose-400 rounded"
        >
          {line}
        </a>
      ) : (
        line
      )}
      <button
        type="button"
        onClick={onCopy}
        className="ml-2 rounded px-2 py-0.5 text-xs text-white/80 bg-white/10 hover:bg-white/15 transition"
        aria-label={`Copy ${value}`}
        title="Copy"
      >
        Copy
      </button>
      <span
        role="status"
        aria-live="polite"
        className={`ml-2 text-xs ${copied ? "opacity-100" : "opacity-0"} transition`}
      >
        Copied!
      </span>
    </p>
  );
}

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
          <h3 className="text-xl font-semibold text-rose-300">Asia–Pacific (APAC) — Chennai, India</h3>
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
              value="+91 90044 91275"
              href="tel:+919004491275"
              ariaLabel="Call APAC phone"
            />
          </div>

          <div className="mt-4 text-sm">
            <p className="font-medium">Rotehügels Headquarters</p>
            <address className="not-italic mt-1 opacity-90">
              No. 1/584, 7th Street, Jothi Nagar, Padianallur,
              <br />
              Near Gangaiamman Kovil, Redhills, Chennai – 600052
              <br />
              Tamil Nadu, India
            </address>
            <p className="mt-3">
              <a
                className="flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.rotehuegels.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit rotehuegels.com"
              >
                <span aria-hidden="true">🌐</span> www.rotehuegels.com
              </a>
            </p>
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Corporate HQ · R&amp;D · Engineering · EPC · Asia-Pacific Client Engagement</p>
            <p className="mt-2">
              <span className="font-medium">Contact:</span> Mr. Sivakumar Shanmugam — Director &amp; CEO
            </p>
          </div>
        </div>

        {/* EMEA — Zambia (no LinkedIn here) */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all duration-300">
          <h3 className="text-xl font-semibold text-rose-300">
            Europe, Middle East &amp; Africa (EMEA) — Zambia
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
              value="+260 77354 0064"
              href="tel:+260773540064"
              ariaLabel="Call EMEA phone"
            />
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Sales &amp; Marketing support across Africa and Europe, coordinated via Chennai and Dallas.</p>
            <p className="mt-2">
              <span className="font-medium">Contact:</span> Ms. Vaishnavi Elumalai — Sales &amp; Marketing (Technical)
            </p>
          </div>
        </div>

        {/* Americas — Dallas (LinkedIn kept here) */}
        <div className="rounded-2xl bg-white/5 p-6 shadow-lg shadow-rose-950/20 hover:border hover:border-rose-400/50 transition-all duration-300">
          <h3 className="text-xl font-semibold text-rose-300">Americas — Dallas, USA</h3>
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
              value="+1 847 778 7595"
              href="tel:+18477787595"
              ariaLabel="Call Americas phone"
            />
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Client acquisition · Partnership development · Investor relations across the Americas.</p>
            <p className="mt-2">
              <span className="font-medium">Contact:</span> Ms. Vaishnavi Elumalai — Sales &amp; Marketing (Technical)
            </p>
            <p className="mt-1">
              <a
                className="flex items-center gap-2 underline-offset-4 hover:underline"
                href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn — Vaishnavi Elumalai"
              >
                <span aria-hidden="true">🔗</span> LinkedIn — Vaishnavi Elumalai
              </a>
            </p>
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
            <p className="mt-1">
              <span className="font-medium">Lead:</span> Mr. Sivakumar Shanmugam — Director &amp; CEO
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-rose-950/30 to-rose-900/10 p-4 shadow-inner">
            <p className="font-medium text-rose-200">EMEA &amp; Americas</p>
            <p className="opacity-90">
              All African &amp; European countries; North, Central &amp; South America
            </p>
            <p className="mt-1">
              <span className="font-medium">Lead:</span> Ms. Vaishnavi Elumalai — Sales &amp; Marketing (Technical)
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
            </a>
          </p>
          <p>
            RFPs / Scope Notes:{" "}
            <a className="text-rose-300 underline-offset-4 hover:underline" href="mailto:sales@rotehuegels.com">
              sales@rotehuegels.com
            </a>
          </p>
        </div>
        <p className="mt-6 text-xs text-white/60">
          We do not share client details. NDAs available on request.
        </p>
      </section>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD injection for SEO
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Rotehügel Research Business Consultancy Pvt. Ltd.",
            url: "https://www.rotehuegels.com",
            logo: "https://www.rotehuegels.com/favicon.ico",
            contactPoint: [
              {
                "@type": "ContactPoint",
                areaServed: "APAC",
                contactType: "customer service",
                email: "apac@rotehuegels.com",
                telephone: "+91-90044-91275",
                availableLanguage: ["en"],
              },
              {
                "@type": "ContactPoint",
                areaServed: "EMEA",
                contactType: "customer service",
                email: "emea@rotehuegels.com",
                telephone: "+260-773540064",
                availableLanguage: ["en"],
              },
              {
                "@type": "ContactPoint",
                areaServed: "Americas",
                contactType: "customer service",
                email: "americas@rotehuegels.com",
                telephone: "+1-847-778-7595",
                availableLanguage: ["en"],
              },
            ],
            address: {
              "@type": "PostalAddress",
              streetAddress:
                "No. 1/584, 7th Street, Jothi Nagar, Padianallur, Near Gangaiamman Kovil, Redhills",
              addressLocality: "Chennai",
              postalCode: "600052",
              addressRegion: "Tamil Nadu",
              addressCountry: "IN",
            },
          }),
        }}
      />
    </main>
  );
}