'use client'

import Image from 'next/image'
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
  Building2
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 }
}

export default function DigitalSolutionsPage() {
  const router = useRouter()

  return (
    <main className="bg-black text-white min-h-screen">

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
            onClick={() => router.push('/contact')}
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg transition hover:scale-105"
          >
            Request Demo
          </button>

          <button className="border border-white/20 px-6 py-3 rounded-lg hover:bg-white/10 transition">
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
          className="relative max-w-4xl mx-auto"
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
            onClick={() => router.push('/contact')}
            className="bg-red-500 hover:bg-red-600 px-10 py-3 rounded-lg hover:scale-105 transition"
          >
            Get Demo
          </button>

        </motion.div>
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

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

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

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

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
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-red-900/40 to-red-700/20 border border-red-500/30 p-12 rounded-2xl shadow-2xl"
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