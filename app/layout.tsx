import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TickerBar from '@/components/TickerBar'
import AuraBackground from '@/components/AuraBackground'
import PageTracker from '@/components/PageTracker'
import AssistWidget from '@/components/AssistWidget'
import PublicShell from '@/components/PublicShell'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rotehuegels.com"),

  title: {
    default: "Rotehügels — Engineering. Technology. Execution.",
    template: "%s | Rotehügels"
  },

  description:
    "Rotehügels designs process plants, builds industrial software (AutoREX™, Operon, LabREX), and operates facilities across metals, mining, battery recycling, and process industries. EPC, plant automation, LIMS, and cloud ERP — Chennai, India.",

  keywords: [
    "Rotehügels",
    "AutoREX",
    "Operon ERP",
    "LabREX LIMS",
    "Plant Automation",
    "Hydrometallurgy",
    "EPC Contractor",
    "Battery Recycling",
    "Black Mass Processing",
    "Critical Minerals",
    "Copper Extraction",
    "Zinc Dross Recovery",
    "Gold Refining",
    "Industrial Automation",
    "Process Plant EPC",
    "SCADA PLC HMI",
    "Laboratory Information Management",
    "Commodity Trading",
    "Metallurgy Consulting",
    "Chennai India"
  ],

  authors: [{ name: "Sivakumar Shanmugam" }],
  creator: "Rotehügels",
  publisher: "Rotehügel Research Business Consultancy Pvt. Ltd.",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Rotehügels — Engineering. Technology. Execution.",
    description: "Process plant EPC, industrial automation (AutoREX™), cloud ERP (Operon), and LIMS (LabREX) for metals, mining, recycling, and process industries worldwide.",
    url: "https://www.rotehuegels.com",
    siteName: "Rotehügels",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Rotehügels",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Rotehügels — Engineering. Technology. Execution.",
    description: "EPC, AutoREX™ plant automation, Operon cloud ERP, LabREX LIMS — for metals, mining, recycling, and process industries.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Suspense fallback={null}><PageTracker /></Suspense>
        <ServiceWorkerRegister />
        <PublicShell>
          <AuraBackground />
          <Header />
          <TickerBar />
        </PublicShell>
        <main>{children}</main>
        <PublicShell>
          <Footer />
          <AssistWidget />
        </PublicShell>
      </body>
    </html>
  )
}