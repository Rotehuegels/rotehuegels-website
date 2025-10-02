// app/about/page.tsx
import React from "react";
import Section from "@/components/Section";
import WebLLMAssistant from "@/components/WebLLMAssistant";

export const metadata = {
  title: "About Us — Rotehügels",
  description:
    "Rotehügels bridges metallurgy research, sustainable technologies, EPC turnkey projects, and business consulting — delivering tomorrow’s solutions today.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16">
      {/* HERO */}
      <Section
        title="About Rotehügels"
        subtitle="Three pillars. Many domains. One purpose — sustainable advantage."
      >
        <p className="text-lg text-zinc-300 max-w-3xl">
          <span className="font-semibold">Rotehügel Research Business Consultancy Private Limited (“Rotehügels”)</span>{" "}
          integrates scientific innovation with strategic advisory and operational execution.
          We partner globally to design circular flows, scale metallurgical processes, and
          deliver investor-ready outcomes—from lab benches to turnkey plants.
        </p>
      </Section>

      {/* NEW: Company Write-up (from your brief) */}
      <Section title="Who We Are">
        <div className="space-y-6 text-zinc-300">
          <p>
            <strong>Rotehügel Research Business Consultancy Private Limited (“Rotehügels”)</strong>, founded on
            <strong> 1st September 2024</strong> and incorporated on <strong>17th September 2025</strong>, is a
            technology development company positioned at the intersection of research, engineering, and execution. We
            focus on delivering innovative process technologies and also act as an EPC partner for greenfield and
            brownfield projects in the domains of critical minerals, metallurgy, circular economy, and sustainable
            industrial development.
          </p>

          <p>
            Our innovation lies in designing and implementing advanced hydrometallurgical and recycling solutions to
            extract copper, tin, lead, and other critical minerals from lean ores, secondary resources, and industrial
            residues. By combining AI-driven modeling, FactSage simulations, and laboratory-scale validations, we
            transform research into practical, scalable solutions that reduce energy consumption, improve recovery
            yields, and minimize waste.
          </p>

          <p>
            What sets Rotehügels apart is its integration of technology development with EPC execution capability.
            Drawing from domestic and international industry experience, including large-scale concentrator projects in
            Africa and recycling pilots in India, we help investors and industries choose the right approach,
            technology, and investment model for plant development. As an EPC partner, we ensure that{" "}
            <strong>safety, compliance, and sustainability</strong> are embedded at every stage—from design to
            commissioning—thereby de-risking projects and enabling reliable long-term performance.
          </p>
        </div>
      </Section>

      <Section title="What We Deliver">
        <ul className="list-disc pl-6 space-y-3 text-sm text-zinc-300">
          <li>
            <strong>Innovation &amp; Development:</strong> Creating next-generation processes for sustainable metal
            extraction and recycling.
          </li>
          <li>
            <strong>Technology-Driven EPC:</strong> Delivering turnkey plant solutions for both greenfield and
            brownfield projects.
          </li>
          <li>
            <strong>Safety &amp; Risk Management:</strong> Embedding safety into design and execution to meet global
            standards.
          </li>
          <li>
            <strong>Investor &amp; Industry Confidence:</strong> Techno-commercial advisory for CAPEX/OPEX optimization
            and future-ready plant design.
          </li>
          <li>
            <strong>Employment &amp; Wealth Creation:</strong> Generating skilled jobs in engineering, operations, and
            R&amp;D while converting underutilized resources into valuable outputs.
          </li>
        </ul>
      </Section>

      <Section title="Vision">
        <p className="text-sm text-zinc-300 max-w-4xl">
          By combining technology innovation, EPC capability, and safety-driven execution, Rotehügels is positioned as a
          catalyst for industrial transformation—contributing to India’s National Critical Minerals Mission and global
          sustainability goals.
        </p>
      </Section>

      {/* PILLARS */}
      <Section title="Our Three Pillars">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              h: "Research",
              p: "Hydrometallurgy R&D, pilot design, process modeling, analytical SOPs — turning lab innovation into scalable flowsheets.",
            },
            {
              h: "Business",
              p: "Techno-economic analysis, procurement collateral, market & policy intelligence — delivering investor-ready clarity.",
            },
            {
              h: "Consultancy",
              p: "Commissioning, ramp-up, troubleshooting, audits, sustainability & circularity roadmaps — ensuring long-term operational excellence.",
            },
          ].map((c, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* EPC & TURNKEY */}
      <Section title="EPC & Turnkey Projects">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Greenfield Plants (Turnkey)</h3>
            <p className="text-sm text-zinc-300">
              End-to-end delivery: FEED, detailed design, vendor/contractor integration,
              construction management, commissioning, and handover with SOPs and training.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Custom & Brownfield Solutions</h3>
            <p className="text-sm text-zinc-300">
              Retrofits, debottlenecking, niche rigs, modular pilots — fast ROI and minimal downtime.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Have an RFP or scope note? Email{" "}
          <a className="text-rose-400 hover:underline" href="mailto:sales@rotehuegels.com">
            sales@rotehuegels.com
          </a>
        </p>
      </Section>

      {/* DOMAINS */}
      <Section title="Domains of Expertise">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { h: "Metallurgy & Process R&D", p: "Copper, nickel, manganese, REEs — lab → pilot → plant." },
            { h: "Circular Economy & Recycling", p: "Battery metals, resource recovery, waste-to-value, ESG." },
            { h: "Techno-Economic Advisory", p: "Feasibility, sensitivity, cost curves, investor collateral." },
            { h: "Plant Commissioning & Ops", p: "Start-up playbooks, SOPs, throughput optimization." },
            { h: "Market Intelligence & Strategy", p: "Supply chain, pricing, and policy insight for GTM." },
            { h: "Business Development", p: "JV structuring, partnerships, and new geography entry." },
            { h: "Research & Patents", p: "Prior-art search, claim drafting, patent strategy." },
            { h: "Laboratory Chemistry", p: "AAS/ICP, titrations, solvent extraction, QA/QC." },
            { h: "Eureka Engineering", p: "Novel separations, modular rigs, zero-to-one prototypes." },
            { h: "Digital & AI Innovation", p: "LLMs, retrieval agents, digital twins, decision support." },
            { h: "Global Policy & ESG", p: "Compliance frameworks and circularity by design." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* IMPACT METRICS */}
      <Section title="Impact at a Glance">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "1200+ TPD", v: "Greenfield plant experience" },
            { k: "↑ Yield", v: "Process optimization & SOP discipline" },
            { k: "↓ OPEX", v: "Circularity & waste-to-value integrations" },
            { k: "Investor-ready", v: "Models, decks & diligence support" },
          ].map((m, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-5">
              <div className="text-2xl font-semibold">{m.k}</div>
              <div className="text-sm text-zinc-400 mt-1">{m.v}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* JOURNEY */}
      <Section title="Our Journey">
        <ol className="relative border-s border-zinc-800">
          {[
            {
              y: "2023–24",
              t: "Hydrometallurgy Pilots",
              d: "Delivered R&D, SOPs, and commissioning for copper and critical metals.",
            },
            {
              y: "2024",
              t: "Expansion into Digital Advisory",
              d: "Launched digital tools, supplier & investor engagement.",
            },
            {
              y: "2025",
              t: "Next-gen Platforms",
              d: "Supplier & employee portals, RFQs, AI-assisted knowledge hubs.",
            },
          ].map((j, i) => (
            <li key={i} className="mb-10 ms-4">
              <div className="absolute w-3 h-3 bg-rose-500 rounded-full mt-1.5 -start-1.5 border border-zinc-900" />
              <time className="mb-1 text-xs font-medium text-zinc-400">{j.y}</time>
              <h4 className="text-sm font-semibold">{j.t}</h4>
              <p className="text-sm text-zinc-300 mt-1">{j.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* VALUES */}
      <Section title="What We Value">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { h: "Evidence-first", p: "Data and validated models over opinions." },
            { h: "Outcomes > Titles", p: "We ship, learn, and document so others can build on it." },
            { h: "Sustainable Advantage", p: "Circularity designed in by default." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-5">
              <h3 className="font-semibold">{c.h}</h3>
              <p className="text-sm text-zinc-300 mt-1">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AI ASSIST */}
      <Section
        title="Talk to Rotehügels Assist"
        subtitle="An AI knowledge companion — runs entirely in your browser with WebGPU."
      >
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-sm text-zinc-300 mb-3">
            Tip: first load may take a minute, but it’s cached after.
          </p>
          <WebLLMAssistant />
        </div>
      </Section>

      {/* CONTACT & CTA */}
      <Section title="Work With Us">
        <p className="text-sm text-zinc-300 mb-4">
          Whether you’re scoping a greenfield plant, exploring recycling, or seeking advisory clarity —
          Rotehügels can help. We work with corporates, entrepreneurs, investors, and institutions worldwide.
        </p>
        <div className="flex gap-4">
          <a href="mailto:sales@rotehuegels.com" className="btn-primary no-underline">
            Start an Engagement
          </a>
          <a href="/careers" className="btn-ghost no-underline">
            Explore Careers
          </a>
        </div>
      </Section>
    </div>
  );
}