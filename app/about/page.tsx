// app/about/page.tsx
import type { ReactElement } from "react";
import Image from "next/image";
import Section from "@/components/Section";
import Link from "next/link";
import {
  ShieldCheck,
  FlaskConical,
  Cog,
  LineChart,
  Users2,
  Linkedin,
  MapPin,
  Factory,
  Cpu,
  Beaker,
  Monitor,
  Gauge,
  Thermometer,
  Droplets,
  Zap,
  Globe,
  Wrench,
  ArrowRight,
  Building2,
} from "lucide-react";

export const metadata = {
  title: "About Rotehügels | Research • EPC • Technology • Critical Minerals",
  description:
    "Rotehügels integrates engineering, technology, and execution — delivering EPC solutions, plant automation (AutoREX™), LIMS (LabREX), and cloud ERP (Operon) across metals, mining, recycling, and process industries worldwide.",
  openGraph: {
    title: "About Rotehügels",
    description:
      "Engineering. Technology. Execution. EPC solutions and proprietary software for process industries worldwide.",
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
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1800px] mx-auto text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 mb-6">
              <Building2 className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">About Rotehügels</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Engineering. Technology.<br />
            <span className="text-rose-400">Execution.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-3xl mx-auto">
            Rotehügels integrates scientific innovation with strategic advisory, technology
            development, and operational execution. We design process plants, build proprietary
            software for industrial operations, supply and commission instrumentation, and
            deliver investor-ready outcomes — from laboratory benches to turnkey plants.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              href="/rotehuegels-story"
              className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-8 py-4 text-base font-semibold text-white transition-colors"
            >
              Read our story <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/success-stories"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-500 px-8 py-4 text-base font-medium text-zinc-300 transition-colors"
            >
              See our projects
            </Link>
          </div>
        </div>
      </section>

      {/* KEY NUMBERS */}
      <section className="mx-auto max-w-[1800px] px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 'Since 2024', label: 'Operating globally' },
            { value: '7+', label: 'Industries served' },
            { value: '3', label: 'Proprietary products' },
            { value: 'India · Africa', label: 'Active regions' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-5 text-center">
              <div className="text-xl font-black text-rose-400">{s.value}</div>
              <div className="text-xs text-zinc-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO WE ARE */}
      <Section title="Who We Are">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <p className="text-zinc-300">
              <strong>Rotehügels</strong> was founded in <strong>September 2024</strong> with its first international
              project in Zambia. What began as a hands-on engineering consultancy has grown into a technology-driven
              company at the intersection of research, engineering, and execution — delivering innovative process
              technologies, proprietary software platforms, and end-to-end EPC solutions.
            </p>
            <p className="text-zinc-300">
              We design and implement advanced <strong>hydrometallurgical</strong> and recycling solutions to extract
              copper, zinc, gold, silver, aluminium, lithium, cobalt, nickel, and other critical minerals from ores,
              secondary resources, and industrial residues. Using <strong>AI-driven modeling</strong>, process
              simulation, and lab-scale validation, we convert research into scalable solutions that reduce energy
              use, improve recovery yields, and minimize waste.
            </p>
            <p className="text-zinc-300">
              What sets us apart is the integration of <strong>technology development</strong> with{" "}
              <strong>EPC execution</strong> and <strong>plant operations management</strong>. We don't just build
              plants — we operate them, track ROI for investors daily, and continuously optimize through our
              proprietary technology stack: <strong>AutoREX™</strong> for automation,{" "}
              <strong>LabREX</strong> for laboratory management, and <strong>Operon</strong> for enterprise operations.
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
              <li>• Research → Pilot → Plant → Operations</li>
              <li>• CAPEX/OPEX clarity from day one</li>
              <li>• Compliance & ESG built-in</li>
              <li>• Daily ROI tracking for investors</li>
            </ul>
          </aside>
        </div>
      </Section>

      {/* OUR TECHNOLOGY */}
      <Section title="Our Technology">
        <p className="text-sm text-zinc-400 mb-6">
          Three proprietary platforms — each independently powerful, seamlessly integrated when combined.
          Available as add-on modules based on client needs.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">AutoREX™</h3>
            </div>
            <p className="text-xs text-amber-200/80 font-medium uppercase tracking-wider mb-2">Plant Automation</p>
            <p className="text-sm text-zinc-300">
              AI-powered plant automation and monitoring software. Integrates with field instruments, PLC/SCADA/DCS systems.
              Real-time production monitoring, predictive analytics, and remote plant management.
            </p>
            <p className="text-xs text-zinc-500 mt-3">Scalable across metals, textiles, food, automotive, paper & pulp</p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-6 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-5 w-5 text-blue-400" />
              <h3 className="font-bold text-white">Operon</h3>
            </div>
            <p className="text-xs text-blue-200/80 font-medium uppercase tracking-wider mb-2">Cloud ERP</p>
            <p className="text-sm text-zinc-300">
              Complete enterprise resource planning for industrial operations. Accounting, HR, payroll, procurement,
              project management, client portal, and investor reporting — all integrated with AutoREX™ and LabREX.
            </p>
            <p className="text-xs text-zinc-500 mt-3">Web-based, mobile-ready, real-time dashboards</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Beaker className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-white">LabREX</h3>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium uppercase tracking-wider mb-2">LIMS</p>
            <p className="text-sm text-zinc-300">
              Laboratory Information Management System supporting ICP-OES, AAS, XRF, wet chemistry, fire assay,
              and mineral processing instruments. Sample tracking, spec compliance, and quality control.
            </p>
            <p className="text-xs text-zinc-500 mt-3">Multi-industry: Cu, Au, Ag, Zn, Li, Co, Ni, Al, black mass</p>
          </div>
        </div>

        {/* Integration message */}
        <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Independent modules. Seamless integration.</h4>
              <p className="text-sm text-zinc-400 mt-1">
                Each product is a standalone platform focused on a distinct aspect of plant operations — automation,
                business management, and laboratory quality. Clients can adopt any single module, or combine all three
                for complete end-to-end control over their project. When deployed together, AutoREX™, Operon, and
                LabREX share data in real time — production metrics flow into ERP reporting, lab results trigger
                quality alerts in the automation layer, and investor dashboards update automatically.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* INDUSTRIES WE SERVE */}
      <Section title="Industries We Serve">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { icon: Factory, name: 'Zinc Processing', desc: 'Dross recovery, electrowinning, refining' },
            { icon: Factory, name: 'Copper Processing', desc: 'Smelting, SX-EW, electrorefining, leaching' },
            { icon: Factory, name: 'Gold & Silver', desc: 'Extraction, CIL/CIP, heap leach, refining' },
            { icon: Factory, name: 'Aluminium', desc: 'Bayer process, Hall-Héroult, recycling' },
            { icon: Zap, name: 'Battery Recycling', desc: 'Black mass, Li/Co/Ni/Mn recovery' },
            { icon: Droplets, name: 'Water Treatment', desc: 'ETP, STP, RO, ZLD, effluent monitoring' },
            { icon: Factory, name: 'Mineral Processing', desc: 'Crushing, flotation, gravity separation' },
            { icon: Factory, name: 'Chemicals', desc: 'Petrochemicals, specialty chemicals' },
            { icon: Wrench, name: 'Textiles', desc: 'Dyeing, bleaching, water recovery' },
            { icon: Wrench, name: 'Food Processing', desc: 'Pasteurisation, fermentation, CIP' },
            { icon: Wrench, name: 'Automotive', desc: 'Paint shop, assembly, testing rigs' },
            { icon: Wrench, name: 'Paper & Pulp', desc: 'Digesters, bleaching, stock prep' },
          ].map((ind, i) => (
            <div key={i} className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4 hover:border-zinc-700 transition-colors">
              <ind.icon className="h-4 w-4 text-rose-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">{ind.name}</h3>
              <p className="text-xs text-zinc-400 mt-1">{ind.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* INSTRUMENTATION & AUTOMATION */}
      <Section title="Instrumentation & Automation">
        <p className="text-sm text-zinc-400 mb-6">
          Complete instrumentation supply, installation, calibration, and commissioning for all process industries.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Thermometer, name: 'Temperature', desc: 'Thermocouples (K/J/T/N/R/S/B), RTDs, pyrometers, thermal imaging' },
            { icon: Gauge, name: 'Pressure & Flow', desc: 'Electromagnetic, ultrasonic, Coriolis, vortex flow meters. Gauge, differential, vacuum transmitters' },
            { icon: Droplets, name: 'Level & Analytical', desc: 'Radar, ultrasonic, capacitance level. pH, ORP, DO, conductivity, turbidity analysers' },
            { icon: Zap, name: 'Electrical & Power', desc: 'Energy meters, power analysers, current transformers, power quality monitors' },
            { icon: ShieldCheck, name: 'Safety Systems', desc: 'ESD, SIS, flame detectors, gas leak detectors, emergency shutdown' },
            { icon: Cpu, name: 'Control & Communication', desc: 'PLC, SCADA, HMI, DCS panels. HART, Modbus, Profibus, OPC UA' },
          ].map((cap, i) => (
            <div key={i} className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-5 hover:border-zinc-700 transition-colors">
              <cap.icon className="h-4 w-4 text-rose-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">{cap.name}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FOUNDER */}
      <Section title="Leadership">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-0">
            <div className="relative shrink-0 w-full sm:w-56 h-64 sm:h-auto">
              <Image
                src="/sivakumar.jpg"
                alt="Sivakumar Shanmugam — Founder & CEO, Rotehügels"
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 224px"
                priority
              />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-xl font-bold text-white">Sivakumar Shanmugam</h3>
                  <p className="text-rose-400 font-medium text-sm mt-0.5">Founder & CEO</p>
                  <p className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                    <MapPin className="h-3 w-3" /> Chennai, Tamil Nadu, India
                  </p>
                </div>
                <a
                  href="https://www.linkedin.com/in/sivakumarshanmugam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sivakumar Shanmugam on LinkedIn"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5 text-rose-400" />
                  LinkedIn
                </a>
              </div>
              <div className="mt-4 space-y-3 text-sm text-zinc-300 leading-relaxed">
                <p>
                  Sivakumar Shanmugam founded Rotehügels with a singular conviction: that the gap between
                  laboratory science and industrial-scale execution is where critical minerals projects fail.
                  He built Rotehügels to close that gap — combining rigorous process research with hands-on
                  EPC delivery and proprietary technology.
                </p>
                <p>
                  With deep expertise in hydrometallurgy, process simulation, plant commissioning, and
                  industrial automation, Sivakumar has delivered large-scale projects across India and Africa.
                  He leads the company's technology direction — including AutoREX™, Operon, and LabREX —
                  global client strategy, and ensures every project is grounded in safety, sustainability,
                  and commercial viability.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Hydrometallurgy", "EPC Delivery", "Critical Minerals",
                  "Plant Automation", "Process Simulation", "Industrial Software",
                ].map((tag) => (
                  <span key={tag} className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-0.5 text-xs text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* WHAT WE DELIVER */}
      <Section title="What We Deliver">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Bullet icon={FlaskConical} title="Innovation & Development" text="Next-gen processes for sustainable metal extraction, recycling, and circular economy." />
          <Bullet icon={Cog} title="Technology-Driven EPC" text="Turnkey plants for greenfield and brownfield deployments — design to commissioning." />
          <Bullet icon={ShieldCheck} title="Safety & Risk Management" text="Safety engineered into design and execution to meet global standards." />
          <Bullet icon={LineChart} title="Investor Confidence" text="Plant operations management with daily ROI tracking, production monitoring, and quality control." />
          <Bullet icon={Monitor} title="Digital Operations" text="Proprietary software stack — AutoREX™, Operon, LabREX — for complete plant digitisation." />
          <Bullet icon={Users2} title="Employment & Wealth Creation" text="Skilled jobs in engineering, operations, and R&D; waste-to-value outcomes." />
        </ul>
      </Section>

      {/* VISION */}
      <Section title="Vision">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-6">
          <p className="text-zinc-300">
            By combining technology innovation, EPC capability, proprietary software, and safety-driven execution,
            Rotehügels is a catalyst for industrial transformation — contributing to India's National Critical Minerals
            Mission and advancing global sustainability goals. Our vision is to be the technology partner of choice for
            process industries worldwide, delivering measurable outcomes through our integrated
            AutoREX™ + Operon + LabREX ecosystem.
          </p>
        </div>
      </Section>

      {/* THREE PILLARS */}
      <Section title="Our Three Pillars">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { h: "Research", p: "Hydrometallurgy R&D, pilot design, process modeling, analytical SOPs — turning lab innovation into scalable flowsheets." },
            { h: "Business", p: "Techno-economic analysis, procurement collateral, market & policy intelligence — investor-ready clarity." },
            { h: "Consultancy", p: "Commissioning, ramp-up, troubleshooting, audits, sustainability & circularity roadmaps — operational excellence." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-6 hover:border-zinc-700 transition-colors">
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* EPC */}
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
          <a className="text-rose-400 hover:underline" href="mailto:sales@rotehuegels.com">sales@rotehuegels.com</a>
        </p>
      </Section>

      {/* DOMAINS */}
      <Section title="Domains of Expertise">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { h: "Metallurgy & Process R&D", p: "Copper, zinc, gold, silver, aluminium, nickel, manganese, REEs — lab → pilot → plant." },
            { h: "Circular Economy & Recycling", p: "Battery recycling, black mass processing, resource recovery, waste-to-value, ESG compliance." },
            { h: "Techno-Economic Advisory", p: "Feasibility, sensitivity, cost curves, investor collateral." },
            { h: "Plant Operations Management", p: "Daily production monitoring, ROI tracking, investor reporting, operations contracts." },
            { h: "Market Intelligence & Strategy", p: "Supply chain, pricing, and policy insight for GTM." },
            { h: "Business Development", p: "JV structuring, partnerships, new geography entry." },
            { h: "Research & Patents", p: "Prior-art search, claim drafting, patent strategy." },
            { h: "Laboratory Chemistry", p: "ICP-OES, AAS, XRF, titrations, fire assay, solvent extraction, QA/QC." },
            { h: "Instrumentation & Automation", p: "Complete process instrumentation, control panels, PLC/SCADA, safety systems." },
            { h: "Digital & AI Innovation", p: "AutoREX™ platform, digital twins, AI-driven decision support." },
            { h: "Global Policy & ESG", p: "Compliance frameworks, sustainability roadmaps, and circularity by design." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-6 hover:border-zinc-700 transition-colors">
              <h3 className="font-semibold mb-2">{c.h}</h3>
              <p className="text-sm text-zinc-300">{c.p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CONNECT */}
      <Section title="Connect With Us">
        <div className="flex flex-wrap gap-4">
          <a href="https://www.linkedin.com/company/rotehuegels" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-2 text-zinc-200 hover:border-zinc-700">
            <Linkedin className="h-5 w-5 text-rose-400" /> Company LinkedIn
          </a>
          <a href="https://www.linkedin.com/in/sivakumarshanmugam/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-4 py-2 text-zinc-200 hover:border-zinc-700">
            <Linkedin className="h-5 w-5 text-rose-400" /> Sivakumar Shanmugam (Founder/CEO)
          </a>
        </div>
      </Section>

      {/* WORK WITH US */}
      <Section title="Work With Us">
        <p className="text-sm text-zinc-300 mb-4">
          Whether you're scoping a greenfield plant, exploring recycling, seeking advisory clarity, or looking for
          a technology partner for plant automation and operations — we work with corporates, entrepreneurs,
          investors, and institutions worldwide.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="mailto:sales@rotehuegels.com" className="btn-primary no-underline">Start an Engagement</a>
          <a href="/customers/register" className="btn-ghost no-underline">Register as Customer</a>
          <a href="/suppliers/register" className="btn-ghost no-underline">Register as Supplier</a>
          <a href="/careers" className="btn-ghost no-underline">Explore Careers</a>
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
              "Technology development, EPC, and plant operations partner for critical minerals, metallurgy, circular economy, and sustainable industrial development. Proprietary products: AutoREX™ (plant automation), Operon (cloud ERP), LabREX (LIMS).",
            contactPoint: [
              { "@type": "ContactPoint", email: "sales@rotehuegels.com", contactType: "sales", areaServed: "Worldwide", availableLanguage: ["en"] },
              { "@type": "ContactPoint", email: "info@rotehuegels.com", contactType: "customer service", areaServed: "Worldwide", availableLanguage: ["en"] },
            ],
          }),
        }}
      />
    </main>
  );
}
