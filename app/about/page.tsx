// app/about/page.tsx
import type { ReactElement } from "react";
import Section from "@/components/Section";
import WebLLMAssistant from "@/components/WebLLMAssistant";
import {
  ShieldCheck,
  FlaskConical,
  Cog,
  LineChart,
  Users2,
  Linkedin,
} from "lucide-react";

export const metadata = {
  title: "About Rotehügels | Research • EPC • Critical Minerals",
  description:
    "Rotehügels unites research, engineering, and execution—delivering innovative process technologies and EPC solutions for critical minerals, metallurgy, circularity, and sustainable industrial development.",
  openGraph: {
    title: "About Rotehügels",
    description:
      "Research. Engineering. Execution. Innovative process technologies and EPC solutions for critical minerals.",
    url: "https://www.rotehuegels.com/about",
    type: "website",
    images: [{ url: "/og-about.png", width: 1200, height: 630, alt: "Rotehügels — Research • EPC" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-about.png"],
  },
};

const Bullet = ({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}): ReactElement => (
  <li className="flex gap-3 rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4">
    <div className="shrink-0 rounded-lg border border-zinc-800/70 bg-zinc-900/80 p-2">
      <Icon className="h-5 w-5 text-rose-400" />
    </div>
    <div>
      <div className="font-medium">{title}</div>
      <p className="text-sm text-zinc-300 mt-1">{text}</p>
    </div>
  </li>
);

export default function AboutPage() {
  return (
    <main className="space-y-20">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-20%,rgba(244,63,94,0.07),transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-6 pt-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              About Rotehügels
            </span>
          </h1>
          <p className="mt-2 text-zinc-400">
            Three pillars. Many domains. One purpose — sustainable advantage.
          </p>

          <div className="mt-6 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6">
            <p className="text-lg text-zinc-200">
              <span className="font-semibold">
                Rotehügel Research Business Consultancy Private Limited (“Rotehügels”)
              </span>{" "}
              integrates scientific innovation with strategic advisory and operational execution. We design circular
              flows, scale metallurgical processes, and deliver investor-ready outcomes—from lab benches to turnkey plants.
            </p>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <Section title="Who We Are">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <p className="text-zinc-300">
              <strong>Rotehügels</strong>, founded on <strong>1st September 2024</strong> and incorporated on{" "}
              <strong>17th September 2025</strong>, is a technology development company at the intersection of research,
              engineering, and execution. We deliver innovative process technologies and act as an EPC partner for
              greenfield and brownfield projects across critical minerals, metallurgy, circular economy, and sustainable
              industrial development.
            </p>
            <p className="text-zinc-300">
              We design and implement advanced <strong>hydrometallurgical</strong> and recycling solutions to extract
              copper, tin, lead, and other critical minerals from lean ores, secondary resources, and industrial residues.
              Using <strong>AI-driven modeling</strong>, <strong>FactSage simulations</strong>, and lab-scale validation,
              we convert research into scalable solutions that reduce energy use, improve recovery yields, and minimize waste.
            </p>
            <p className="text-zinc-300">
              What sets us apart is our integration of <strong>technology development</strong> with{" "}
              <strong>EPC execution</strong>. With experience spanning large-scale concentrators in Africa and recycling
              pilots in India, we help investors and industries choose the right approach, technology, and investment model.
              As an EPC partner, we embed <strong>safety, compliance, and sustainability</strong> at every stage—from design
              to commissioning—de-risking projects and ensuring reliable long-term performance.
            </p>
          </div>

          {/* Right rail callout */}
          <aside className="h-fit rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-5">
            <div className="text-sm font-medium text-rose-300">Our Promise</div>
            <p className="mt-2 text-sm text-rose-100/90">
              Tech that ships. Plants that perform. Safety by design.
              Decisions backed by models, validated in the lab, and hardened in the field.
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-rose-500/40 to-transparent" />
            <ul className="mt-4 space-y-2 text-sm text-rose-100/90">
              <li>• Research → Pilot → Plant</li>
              <li>• CAPEX/OPEX clarity</li>
              <li>• Compliance & ESG built-in</li>
            </ul>
          </aside>
        </div>
      </Section>

      {/* WHAT WE DELIVER */}
      <Section title="What We Deliver">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Bullet
            icon={FlaskConical}
            title="Innovation & Development"
            text="Next-gen processes for sustainable metal extraction and recycling."
          />
          <Bullet
            icon={Cog}
            title="Technology-Driven EPC"
            text="Turnkey plants for greenfield and brownfield deployments."
          />
          <Bullet
            icon={ShieldCheck}
            title="Safety & Risk Management"
            text="Safety engineered into design and execution to meet global standards."
          />
          <Bullet
            icon={LineChart}
            title="Investor & Industry Confidence"
            text="Techno-commercial advisory for CAPEX/OPEX optimization and future-ready design."
          />
          <Bullet
            icon={Users2}
            title="Employment & Wealth Creation"
            text="Skilled jobs in engineering, operations, and R&D; waste-to-value outcomes."
          />
        </ul>
      </Section>

      {/* VISION */}
      <Section title="Vision">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6">
          <p className="text-zinc-300">
            By combining technology innovation, EPC capability, and safety-driven execution, Rotehügels is a catalyst
            for industrial transformation—contributing to India’s National Critical Minerals Mission and advancing
            global sustainability goals.
          </p>
        </div>
      </Section>

      {/* CONNECT */}
      <Section title="Connect With Us">
        <div className="flex flex-wrap gap-4">
          <a
            href="https://www.linkedin.com/company/rotehuegels"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-2 text-zinc-200 hover:border-zinc-700"
            aria-label="Rotehügels on LinkedIn"
          >
            <Linkedin className="h-5 w-5 text-rose-400" />
            Company LinkedIn
          </a>
          <a
            href="https://www.linkedin.com/in/sivakumarshanmugam/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-2 text-zinc-200 hover:border-zinc-700"
            aria-label="Sivakumar Shanmugam on LinkedIn"
          >
            <Linkedin className="h-5 w-5 text-rose-400" />
            Sivakumar Shanmugam (Founder/CEO)
          </a>
        </div>
      </Section>

      {/* EXISTING SECTIONS (kept, visually tightened) */}
      <Section title="Our Three Pillars">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              h: "Research",
              p: "Hydrometallurgy R&D, pilot design, process modeling, analytical SOPs — turning lab innovation into scalable flowsheets.",
            },
            {
              h: "Business",
              p: "Techno-economic analysis, procurement collateral, market & policy intelligence — investor-ready clarity.",
            },
            {
              h: "Consultancy",
              p: "Commissioning, ramp-up, troubleshooting, audits, sustainability & circularity roadmaps — operational excellence.",
            },
          ].map((c, i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-6 hover:border-zinc-700 transition-colors"
            >
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="EPC & Turnkey Projects">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-6">
            <h3 className="font-semibold mb-2">Greenfield Plants (Turnkey)</h3>
            <p className="text-sm text-zinc-300">
              End-to-end delivery: FEED, detailed design, vendor/contractor integration, construction management,
              commissioning, and handover with SOPs and training.
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-6">
            <h3 className="font-semibold mb-2">Custom & Brownfield Solutions</h3>
            <p className="text-sm text-zinc-300">
              Retrofits, debottlenecking, niche rigs, modular pilots — fast ROI and minimal downtime.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Have an RFP or scope note? Email{" "}
          <a
            className="text-rose-400 hover:underline"
            href="mailto:sales@rotehuegels.com"
          >
            sales@rotehuegels.com
          </a>
        </p>
      </Section>

      <Section title="Domains of Expertise">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { h: "Metallurgy & Process R&D", p: "Copper, nickel, manganese, REEs — lab → pilot → plant." },
            { h: "Circular Economy & Recycling", p: "Battery metals, resource recovery, waste-to-value, ESG." },
            { h: "Techno-Economic Advisory", p: "Feasibility, sensitivity, cost curves, investor collateral." },
            { h: "Plant Commissioning & Ops", p: "Start-up playbooks, SOPs, throughput optimization." },
            { h: "Market Intelligence & Strategy", p: "Supply chain, pricing, and policy insight for GTM." },
            { h: "Business Development", p: "JV structuring, partnerships, new geography entry." },
            { h: "Research & Patents", p: "Prior-art search, claim drafting, patent strategy." },
            { h: "Laboratory Chemistry", p: "AAS/ICP, titrations, solvent extraction, QA/QC." },
            { h: "Eureka Engineering", p: "Novel separations, modular rigs, zero-to-one prototypes." },
            { h: "Digital & AI Innovation", p: "LLMs, retrieval agents, digital twins, decision support." },
            { h: "Global Policy & ESG", p: "Compliance frameworks and circularity by design." },
          ].map((c, i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-6 hover:border-zinc-700 transition-colors"
            >
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Talk to Rotehügels Assist"
        subtitle="An AI knowledge companion — runs entirely in your browser with WebGPU."
      >
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-5">
          <p className="text-sm text-zinc-300 mb-3">
            Tip: first load may take a minute, but it’s cached after.
          </p>
          <WebLLMAssistant />
        </div>
      </Section>

      <Section title="Work With Us">
        <p className="text-sm text-zinc-300 mb-4">
          Whether you’re scoping a greenfield plant, exploring recycling, or seeking advisory clarity — we work with
          corporates, entrepreneurs, investors, and institutions worldwide.
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

      {/* SEO: Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Rotehügel Research Business Consultancy Private Limited",
            alternateName: "Rotehügels",
            url: "https://www.rotehuegels.com",
            logo: "https://www.rotehuegels.com/logo.png",
            sameAs: [
              "https://www.linkedin.com/company/rotehuegels",
              "https://www.linkedin.com/in/sivakumarshanmugam/",
            ],
            foundingDate: "2024-09-01",
            description:
              "Technology development and EPC partner for critical minerals, metallurgy, circular economy, and sustainable industrial development.",
            contactPoint: [
              {
                "@type": "ContactPoint",
                email: "sales@rotehuegels.com",
                contactType: "sales",
                areaServed: "IN",
                availableLanguage: ["en"],
              },
            ],
          }),
        }}
      />
    </main>
  );
}