// app/about/page.tsx
import React from "react";
import Section from "@/components/Section";
import WebLLMAssistant from "@/components/WebLLMAssistant";

export const metadata = {
  title: "About Us — Rotehügels",
  description:
    "Rotehügels bridges metallurgy research, sustainable technologies, and business consulting — delivering tomorrow’s solutions today.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16">
      {/* Intro */}
      <Section
        title="About Rotehügels"
        subtitle="Research. Innovation. Sustainable Business."
      >
        <div className="prose prose-invert max-w-none">
          <p>
            <span className="font-semibold">Rotehügels Research Business Consultancy Pvt. Ltd.</span>{" "}
            integrates scientific innovation with strategic business advisory.
            We operate at the intersection of{" "}
            <span className="text-rose-400">extractive metallurgy</span>,{" "}
            <span className="text-rose-400">critical minerals</span>, and{" "}
            <span className="text-rose-400">circular economy</span> to help
            organizations achieve measurable, globally relevant outcomes.
          </p>
          <p>
            From lab-scale R&D and pilot design to plant commissioning and
            digital knowledge systems, our mission is simple:{" "}
            <em>
              to deliver sustainable growth by turning today’s challenges into
              tomorrow’s opportunities.
            </em>
          </p>
        </div>
      </Section>

      {/* What we do */}
      <Section title="Our Expertise">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Metallurgy & Process R&D</h3>
            <p className="text-sm text-zinc-300">
              Copper, nickel, manganese, rare earths and beyond — hydrometallurgy,
              pyro-processing, and hybrid flowsheets. We design, test, and
              optimize processes for lean and complex ores.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Sustainability & Circular Economy</h3>
            <p className="text-sm text-zinc-300">
              Resource recovery, battery recycling, and zero-waste operations.
              We enable compliance with ESG standards while unlocking new revenue streams.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Techno-Economic Advisory</h3>
            <p className="text-sm text-zinc-300">
              From feasibility studies and market intelligence to investor-ready
              models — we bring clarity and confidence to strategic decisions.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Plant Commissioning & Operations</h3>
            <p className="text-sm text-zinc-300">
              Experience from large-scale greenfield plants. We help teams scale
              from pilot to production with robust training, SOPs, and optimization.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Digital & AI Innovation</h3>
            <p className="text-sm text-zinc-300">
              Custom AI agents, LLMs, and digital twins for process modeling,
              knowledge management, and decision support.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2">Global Partnerships</h3>
            <p className="text-sm text-zinc-300">
              We collaborate with academia, industry, and policy stakeholders
              worldwide to build sustainable and future-ready solutions.
            </p>
          </div>
        </div>
      </Section>

      {/* Journey */}
      <Section title="Our Journey">
        <ol className="relative border-s border-zinc-800">
          <li className="mb-10 ms-4">
            <div className="absolute w-3 h-3 bg-rose-500 rounded-full mt-1.5 -start-1.5 border border-zinc-900" />
            <time className="mb-1 text-xs font-medium text-zinc-400">2023–24</time>
            <h4 className="text-sm font-semibold">Hydrometallurgy Pilots</h4>
            <p className="text-sm text-zinc-300 mt-1">
              Delivered R&D, SOPs, and commissioning for copper and critical
              metals from mixed and lean ores.
            </p>
          </li>
          <li className="mb-10 ms-4">
            <div className="absolute w-3 h-3 bg-rose-500 rounded-full mt-1.5 -start-1.5 border border-zinc-900" />
            <time className="mb-1 text-xs font-medium text-zinc-400">2024</time>
            <h4 className="text-sm font-semibold">Expansion into Digital Advisory</h4>
            <p className="text-sm text-zinc-300 mt-1">
              Strengthened our portfolio with supplier and investor engagement,
              and launched digital tools to support client decisions.
            </p>
          </li>
          <li className="mb-10 ms-4">
            <div className="absolute w-3 h-3 bg-rose-500 rounded-full mt-1.5 -start-1.5 border border-zinc-900" />
            <time className="mb-1 text-xs font-medium text-zinc-400">2025</time>
            <h4 className="text-sm font-semibold">Next-gen Platforms</h4>
            <p className="text-sm text-zinc-300 mt-1">
              Rolling out supplier & employee portals with secure document exchange,
              RFQs, and AI-assisted knowledge hubs.
            </p>
          </li>
        </ol>
      </Section>

      {/* In-browser AI */}
      <Section
        title="Talk to Rotehügels Assist"
        subtitle="An AI knowledge companion — runs entirely in your browser with WebGPU."
      >
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-sm text-zinc-300 mb-3">
            Tip: first load downloads the model once and may take a minute
            on slower networks. It’s cached after.
          </p>
          <WebLLMAssistant />
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact">
        <p className="text-sm text-zinc-300">
          Write to{" "}
          <a
            className="text-rose-400 hover:underline"
            href="mailto:sales@rotehuegels.com"
          >
            sales@rotehuegels.com
          </a>{" "}
          or use the floating chat bubble to connect with our AI assistant.
        </p>
      </Section>
    </div>
  );
}