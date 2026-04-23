'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Cpu,
  Activity,
  Brain,
  Cog,
  Factory,
  Shirt,
  Utensils,
  Car,
  FileText,
  Building2,
  LayoutDashboard,
  FlaskConical,
  ArrowRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 }
}

export default function DigitalSolutionsPage() {
  const router = useRouter()

  return (
    <main className="text-white min-h-screen">

      {/* HERO */}
      <section className="text-center py-32 px-6 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20 blur-3xl"></div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold mb-6 relative"
        >
          Digital Intelligence for <span className="text-red-500">Industrial Plants</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto mb-8 relative"
        >
          Real-time monitoring, AI-driven control, and intelligent automation for next-generation industrial operations.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 relative"
        >
          <button
            onClick={() => router.push('/book/autorex-suite-demo')}
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg transition hover:scale-105"
          >
            Book a demo
          </button>

          <button
            onClick={() => router.push('/digital-solutions/autorex')}
            className="border border-white/20 px-6 py-3 rounded-lg hover:bg-white/10 transition"
          >
            Explore Platform
          </button>
        </motion.div>
      </section>

      {/* AUTOREX HERO (NEXT LEVEL) */}
      <section className="py-32 px-6 text-center relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-transparent to-red-900/30 blur-3xl"></div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative max-w-[1800px] mx-auto"
        >

          {/* FLOATING LOGO */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="flex justify-center mb-8"
          >
            <div className="bg-black/50 border border-white/10 p-6 rounded-2xl shadow-2xl">
              <Image src="/autorex-logo.jpg" alt="AutoREX" width={140} height={140} />
            </div>
          </motion.div>

          <h2 className="text-4xl font-bold mb-3">AutoREX™</h2>

          <p className="text-gray-400 mb-8">
            Rotehügels Intelligent Process Automation System
          </p>

          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
            AutoREX™ transforms industrial plants into intelligent ecosystems by integrating real-time data,
            AI-driven analytics, and autonomous control. It enables predictive decision-making, reduces downtime,
            and continuously optimizes plant performance.
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-gray-300 max-w-2xl mx-auto mb-10 text-left">
            <div>• Real-time monitoring of process parameters</div>
            <div>• AI-based anomaly detection</div>
            <div>• Predictive maintenance systems</div>
            <div>• Remote plant control</div>
            <div>• Energy optimization</div>
            <div>• Scalable multi-plant architecture</div>
          </div>

          <button
            onClick={() => router.push('/book/autorex-suite-demo')}
            className="bg-red-500 hover:bg-red-600 px-10 py-3 rounded-lg hover:scale-105 transition"
          >
            Book a demo
          </button>

        </motion.div>
      </section>

      {/* MODULE SUITE — AutoREX + Operon + LabREX */}
      <section className="py-32 px-6 relative">
        <div className="max-w-[1800px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The Integrated Platform Suite</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              AutoREX™ is the process-automation core. <strong className="text-white">Operon</strong> and{' '}
              <strong className="text-white">LabREX</strong> plug in as first-class add-on modules — sharing a single
              identity layer, audit trail, and document store. Deploy one, add the others as you scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* AutoREX — core */}
            <Link href="/digital-solutions/autorex" className="no-underline">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="border border-red-500/30 p-8 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent shadow-lg shadow-red-500/10 hover:border-red-500/60 hover:shadow-red-500/20 transition cursor-pointer h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  <Cpu className="text-red-500" size={40} />
                  <span className="text-[10px] uppercase tracking-widest text-red-400/80 border border-red-400/30 rounded-full px-2 py-0.5">Core platform</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">AutoREX™</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Process-automation core — data ingestion from SCADA / DCS / PLC layers, AI anomaly detection,
                  predictive maintenance, energy optimisation, and autonomous control loops.
                </p>
                <ul className="text-sm text-gray-300 space-y-1 mb-4">
                  <li>• Real-time process-data ingestion</li>
                  <li>• AI + rule-based control logic</li>
                  <li>• Plant-wide digital twin</li>
                  <li>• OT / IT bridge layer</li>
                </ul>
                <span className="mt-auto inline-flex items-center gap-1 text-xs text-red-400">
                  Explore AutoREX <ArrowRight className="h-3 w-3" />
                </span>
              </motion.div>
            </Link>

            {/* Operon — ERP add-on */}
            <Link href="/digital-solutions/operon" className="no-underline">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="border border-white/10 p-8 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-sky-500/40 transition cursor-pointer h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  <LayoutDashboard className="text-sky-400" size={40} />
                  <span className="text-[10px] uppercase tracking-widest text-sky-400/80 border border-sky-400/30 rounded-full px-2 py-0.5">Business layer</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Operon</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Full SaaS ERP covering accounts, HR, payroll, procurement, inventory, sales, and statutory compliance.
                  Production and consumption data flow in directly from AutoREX — no duplicate entry, no reconciliation gap.
                </p>
                <ul className="text-sm text-gray-300 space-y-1 mb-4">
                  <li>• Accounts + GST + e-way bills</li>
                  <li>• HR, payroll, attendance, ATS</li>
                  <li>• Procurement + inventory + shipments</li>
                  <li>• Live production-cost dashboards</li>
                </ul>
                <span className="mt-auto inline-flex items-center gap-1 text-xs text-sky-400">
                  Explore Operon <ArrowRight className="h-3 w-3" />
                </span>
              </motion.div>
            </Link>

            {/* LabREX — LIMS add-on */}
            <Link href="/digital-solutions/labrex" className="no-underline">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: 0.2 }}
                className="border border-white/10 p-8 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 transition cursor-pointer h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  <FlaskConical className="text-emerald-400" size={40} />
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 border border-emerald-400/30 rounded-full px-2 py-0.5">Lab &amp; QA</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">LabREX</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Multi-industry LIMS — sample intake, instrument integration (ICP-OES, AAS, wet-chem, furnace),
                  certificate-of-analysis generation, assay trend analytics. Results auto-sync to AutoREX to drive
                  process-correction decisions in real time.
                </p>
                <ul className="text-sm text-gray-300 space-y-1 mb-4">
                  <li>• Sample + instrument lifecycle</li>
                  <li>• Cu / Au / Ag / Zn / black mass / Al methods</li>
                  <li>• Auto-generated CoAs &amp; compliance reports</li>
                  <li>• Closed-loop to AutoREX process control</li>
                </ul>
                <span className="mt-auto inline-flex items-center gap-1 text-xs text-emerald-400">
                  Explore LabREX <ArrowRight className="h-3 w-3" />
                </span>
              </motion.div>
            </Link>

          </div>
        </div>
      </section>

      {/* PROCESS FLOW */}
      <section className="text-center py-32 px-6 space-y-28">

        {[
          {
            icon: Activity,
            title: 'Data Acquisition',
            desc: 'Capture real-time plant data from sensors including temperature, pressure, flow, and level instruments.'
          },
          {
            icon: Brain,
            title: 'AI Processing',
            desc: 'Analyze process data using intelligent algorithms to detect patterns, predict failures, and optimize performance.'
          },
          {
            icon: Cog,
            title: 'Control & Automation',
            desc: 'Execute automated decisions and optimize operations in real-time with minimal manual intervention.'
          }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ delay: i * 0.2 }}
          >
            <item.icon className="mx-auto mb-4 text-red-500" size={34} />
            <h3 className="text-3xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-400 max-w-xl mx-auto">{item.desc}</p>
          </motion.div>
        ))}

      </section>

      {/* TECHNOLOGY STACK */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">Technology Stack</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-[1800px] mx-auto">

          {[
            { icon: Cpu, title: 'AI & Machine Learning' },
            { icon: Activity, title: 'Industrial IoT' },
            { icon: Cog, title: 'Real-Time Processing' },
            { icon: Cpu, title: 'Cloud & Edge Computing' },
            { icon: Brain, title: 'Computer Vision' },
            { icon: Factory, title: 'Digital Twin' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="border border-white/10 p-6 rounded-xl bg-white/5 hover:bg-white/10 transition shadow-md"
            >
              <item.icon className="mx-auto mb-3 text-red-500" />
              <p>{item.title}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">Scalable Across Industries</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-[1800px] mx-auto">

          {[
            { icon: Factory, title: 'Metals & Mining' },
            { icon: Shirt, title: 'Textiles' },
            { icon: Utensils, title: 'Food Processing' },
            { icon: Car, title: 'Automotive' },
            { icon: FileText, title: 'Paper & Pulp' },
            { icon: Building2, title: 'Commercial Facilities' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="border border-white/10 p-6 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <item.icon className="mx-auto mb-3 text-red-500" />
              <p>{item.title}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-[1800px] mx-auto text-center bg-gradient-to-r from-red-900/40 to-red-700/20 border border-red-500/30 p-12 rounded-2xl shadow-2xl"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Digitize Your Plant?</h2>
          <p className="text-gray-300 mb-6">
            Deploy AutoREX™ and transform your plant into an intelligent, autonomous operation.
          </p>

          <button
            onClick={() => router.push('/contact')}
            className="bg-red-500 hover:bg-red-600 px-8 py-3 rounded-lg hover:scale-105 transition"
          >
            Contact Us
          </button>
        </motion.div>
      </section>

    </main>
  )
}