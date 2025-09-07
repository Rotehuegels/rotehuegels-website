"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Cog,
  Beaker,
  Cpu,
  LineChart,
  Lightbulb,
  Compass,
  FileText,
  Atom,
  ShieldCheck,
  Users,
  Rocket,
} from "lucide-react";

export default function CareersPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const domains = [
    {
      title: "Design & Human Factors",
      icon: Compass,
      blurb:
        "Designers who turn complex metallurgical and circular-economy ideas into elegant products, UIs, visual systems, and pilot rigs people actually use.",
      tags: ["Product Design", "UX/UI", "Industrial"],
    },
    {
      title: "Metallurgy & Process Innovation",
      icon: Beaker,
      blurb:
        "Metallurgists who love flowsheets: leach–SX–EW, flotation, refining, and scale-up from bench to plant with uncompromising safety and yield.",
      tags: ["Hydromet", "Pyromet", "Scale-up"],
    },
    {
      title: "Computing & Data Systems",
      icon: Cpu,
      blurb:
        "Engineers who build robust software, data pipelines, plant digital twins, edge/IoT, and secure infra the business can rely on.",
      tags: ["Full-stack", "IoT/Edge", "DevOps"],
    },
    {
      title: "Market Intelligence & Strategy",
      icon: LineChart,
      blurb:
        "Analysts who map supply chains, price curves, policy, and customer insight to guide our go-to-market and partnerships.",
      tags: ["Research", "Pricing", "Policy"],
    },
    {
      title: "Business Development",
      icon: Rocket,
      blurb:
        "People who craft win-win deals, grow accounts, and open new geographies across mining, recycling, and advanced materials.",
      tags: ["Partnerships", "Sales Ops", "Alliances"],
    },
    {
      title: "Research & Patents",
      icon: FileText,
      blurb:
        "Engineers who turn lab results into defensible IP—prior-art searches, claims drafting, and patent strategy with scientists.",
      tags: ["IP", "Tech Transfer", "Diligence"],
    },
    {
      title: "Laboratory Chemistry",
      icon: FlaskConical,
      blurb:
        "Chemists who run precise wet-lab programs—AAS/ICP, titrations, bench leach, solvent extraction, QA/QC—fast and reproducibly.",
      tags: ["Analytical", "Method Dev", "QA/QC"],
    },
    {
      title: "Eureka Engineering",
      icon: Lightbulb,
      blurb:
        "Tinkerers who test unconventional ideas: niche separations, novel reagents, modular rigs, and zero-to-one prototypes.",
      tags: ["R&D", "Prototyping", "Pilots"],
    },
    {
      title: "AI & Custom LLM Agents",
      icon: Atom,
      blurb:
        "AI engineers who fine-tune domain models, retrieval pipelines, and on-prem agents for labs, plants, and business workflows.",
      tags: ["RAG", "Fine-tune", "Agents"],
    },
  ];

  const values = [
    {
      title: "Think Bold",
      copy:
        "Out-of-the-box is day one. We prize original thought grounded in first principles and real-world constraints.",
      icon: Lightbulb,
    },
    {
      title: "Build Sustainably",
      copy:
        "Every design choice should move us toward circularity: lower footprints, longer lifecycles, and smarter reuse.",
      icon: ShieldCheck,
    },
    {
      title: "Own Outcomes",
      copy:
        "Autonomy with accountability. You ship, measure, and iterate—lab to plant to market.",
      icon: Cog,
    },
    {
      title: "Learn Fast",
      copy:
        "Experiments over opinions. We document, share, and improve as a team.",
      icon: Users,
    },
  ];

  const faqs = [
    {
      q: "Do you hire for senior consulting engagements?",
      a: "Yes. We actively collaborate with industry experts for short-term sprints and longer research partnerships across metallurgy, sustainability, digital, and policy.",
    },
    {
      q: "I don’t see my exact background—should I still apply?",
      a: "Absolutely. If you’re mission-aligned and have demonstrated excellence, tell us how you’ll raise the bar.",
    },
    {
      q: "Remote or on-site?",
      a: "Hybrid. Lab and pilot work are on-site; analysis, software, and writing can be remote depending on project needs.",
    },
  ];

  return (
    <div className="min-h-screen"> {/* global dark bg comes from globals.css */}
      {/* Hero */}
      <section className="relative">
        {/* Remove light gradient; keep spacing; ensure contrast */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-100"
          >
            Build tomorrow’s materials economy—today.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-4 text-lg md:text-xl text-slate-300 max-w-3xl"
          >
            Rotehügels is a research-business consultancy advancing
            sustainability and circular economy across metals, recycling, and
            advanced manufacturing. We’re assembling a team of domain experts
            who love hard problems and elegant solutions.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:hr@rotehuegels.com?subject=Open%20Application%20—%20Roteh%C3%BCgels&body=Share%20links%20to%20your%20work%2C%20CV%2C%20and%20a%20200-word%20note%20on%20why%20you."
              className="btn btn-primary"
            >
              Open Application
            </a>
            <a href="#domains" className="btn btn-ghost">
              Explore Domains
            </a>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-4">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card"
            >
              <v.icon className="w-6 h-6 text-slate-200" />
              <div className="mt-3 font-semibold text-slate-100">{v.title}</div>
              <p className="text-sm text-slate-300 mt-1">{v.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Domains */}
      <section id="domains" className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Domains we’re hiring for
          </h2>
          <p className="text-slate-300 max-w-xl">
            No rigid designations—join as a domain expert. Tell us the outcomes
            you can own and the systems you can improve.
          </p>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {domains.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
              className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <d.icon className="w-6 h-6 text-slate-200" />
                <div className="font-semibold tracking-tight text-slate-100">
                  {d.title}
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-2">{d.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2 items-center">
                <a
                  className="text-sm underline underline-offset-4 text-slate-200"
                  href={`mailto:hr@rotehuegels.com?subject=${encodeURIComponent(
                    "Domain Application — " + d.title
                  )}&body=${encodeURIComponent(
                    "Share: CV/LinkedIn, portfolio or repo links, and a 200-word note on the outcomes you’ll own in this domain."
                  )}`}
                >
                  Apply for this domain
                </a>
                <span className="text-slate-500">·</span>
                <a
                  className="text-sm text-slate-300 underline underline-offset-4"
                  href="mailto:hr@rotehuegels.com?subject=Questions%20about%20domains"
                >
                  Ask a question
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Consultants & Industry Experts */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow">
          <div className="flex items-start gap-4">
            <Users className="w-7 h-7 text-slate-200" />
            <div>
              <h3 className="text-xl font-semibold text-slate-100">
                Industry Experts & Associates
              </h3>
              <p className="mt-2 text-slate-300">
                We welcome senior professionals to collaborate on consulting,
                joint research, and technology development. If you bring deep
                expertise—operations, process design, market/regulatory, IP, or
                venture building—let’s design an engagement around outcomes.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="mailto:hr@rotehuegels.com?subject=Consulting%20Engagement%20Proposal&body=Outline%20your%20expertise%2C%20availability%2C%20and%20where%20you%20can%20create%20impact.%20Links%20to%20past%20work%20welcome."
                  className="btn btn-primary"
                >
                  Propose an engagement
                </a>
                <a
                  href="mailto:hr@rotehuegels.com?subject=Research%20Collaboration&body=Share%20your%20research%20interests%2C%20current%20projects%2C%20and%20how%20we%20can%20collaborate."
                  className="btn btn-ghost"
                >
                  Research collaboration
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we look for */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-5">
          {["Evidence of excellence", "Systems thinking", "Hands-on bias"].map(
            (k, i) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow"
              >
                <div className="font-semibold text-slate-100">{k}</div>
                <p className="text-sm text-slate-300 mt-1">
                  {i === 0 &&
                    "Show your best work: papers, prototypes, pilots, code, or deals—impact over titles."}
                  {i === 1 &&
                    "Connect lab, plant, market, and policy. Design for sustainability and circularity by default."}
                  {i === 2 &&
                    "You ship. You test. You learn. You document so others can build on it."}
                </p>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* How to apply */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow">
          <h3 className="text-xl font-semibold text-slate-100">How to apply</h3>
          <ul className="mt-3 list-disc list-inside text-slate-300 space-y-1">
            <li>
              Subject:{" "}
              <span className="font-mono">
                Domain Application — &lt;Your Domain&gt;
              </span>
            </li>
            <li>
              Attach a CV or link to LinkedIn/GitHub/Google Scholar/Portfolio.
            </li>
            <li>200-word note: outcomes you’ll own in your first 90 days.</li>
            <li>Links to 1–3 pieces of work you’re proud of.</li>
            <li>
              Send to{" "}
              <a className="underline underline-offset-4" href="mailto:hr@rotehuegels.com">
                hr@rotehuegels.com
              </a>.
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h3 className="text-xl font-semibold text-slate-100">FAQs</h3>
        <div className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
          {faqs.map((f, i) => (
            <div key={i} className="p-5">
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full text-left flex items-center justify-between gap-4"
              >
                <span className="font-medium text-slate-100">{f.q}</span>
                <span className="text-slate-400">
                  {openFAQ === i ? "−" : "+"}
                </span>
              </button>
              {openFAQ === i && (
                <p className="mt-2 text-slate-300">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-slate-400">
          © {new Date().getFullYear()} Rotehügels. Building sustainable advantage.
        </div>
      </footer>
    </div>
  );
}
