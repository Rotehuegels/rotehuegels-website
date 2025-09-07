// app/page.tsx
import React from "react";
import Link from "next/link";
import Section from "@/components/Section";

export const metadata = {
  title:
    "Rotehügels — Research, Circular Economy, EPC & Business Advisory",
  description:
    "Rotehügel Research Business Consultancy Private Limited integrates scientific innovation, strategic advisory, and turnkey execution for metals, recycling, and sustainable industry.",
};

export default function HomePage() {
  return (
    <div className="space-y-16">

      {/* HERO (first screen) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-black to-zinc-900 py-24">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-4xl">
            Building Sustainable Advantage in{" "}
            <span className="text-rose-500">Metals, Recycling & Strategy</span>
          </h1>

          <p className="mt-6 text-lg text-zinc-300 max-w-2xl">
            Rotehügel Research Business Consultancy Private Limited integrates
            scientific innovation, strategic advisory, and turnkey execution to
            deliver measurable outcomes for the world’s most critical industries.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/services" className="btn-primary no-underline">
              Explore Our Services
            </Link>
            <Link href="/success-stories" className="btn-ghost no-underline">
              View Success Stories
            </Link>
          </div>

          {/* Impact Metrics in hero */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { k: "1200+ TPD", v: "Greenfield plant design & commissioning" },
              { k: "10+ Domains", v: "Metallurgy, recycling, circular economy, AI" },
              { k: "Global Partnerships", v: "Academia, industry, policy stakeholders" },
            ].map((m, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-6 shadow"
              >
                <div className="text-2xl font-semibold text-white">{m.k}</div>
                <div className="text-sm text-zinc-400 mt-1">{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative glow */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 800 800"
          >
            <circle cx="400" cy="400" r="400" fill="url(#grad1)" />
            <defs>
              <radialGradient id="grad1">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* What we do – three pillars */}
      <Section title="Where Research Meets Business">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              h: "Research",
              p: "Hydrometallurgy R&D, pilot design, process modeling, analytical SOPs.",
              href: "/services/research",
            },
            {
              h: "Business",
              p: "Techno-economics, market analysis, procurement collateral, policy watch.",
              href: "/services/business",
            },
            {
              h: "Consultancy",
              p: "Commissioning, ramp-up, troubleshooting, audits, remote ops & KPIs.",
              href: "/services/consultancy",
            },
          ].map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow"
            >
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
              <div className="mt-4">
                <Link href={c.href} className="btn-ghost no-underline">
                  Explore
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Quick links */}
      <Section title="Keep Exploring">
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="btn-ghost no-underline">
            About Us
          </Link>
          <Link href="/suppliers" className="btn-ghost no-underline">
            Suppliers
          </Link>
          <Link href="/current-updates" className="btn-ghost no-underline">
            Current Updates
          </Link>
          <Link href="/careers" className="btn-ghost no-underline">
            Careers
          </Link>
          <Link href="/contact" className="btn-primary no-underline">
            Contact Us
          </Link>
        </div>
      </Section>
    </div>
  );
}