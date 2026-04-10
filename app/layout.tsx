import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TickerBar from '@/components/TickerBar'
import AuraBackground from '@/components/AuraBackground'
import PageTracker from '@/components/PageTracker'
import AssistWidget from '@/components/AssistWidget'

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rotehuegels.com"),

  title: {
    default: "Rotehügels - Where Research Meets Business Excellence",
    template: "%s | Rotehügels"
  },

  description:
    "Rotehügel Research Business Consultancy Pvt. Ltd., Chennai. EPC, process engineering, hydrometallurgy, critical minerals, battery recycling, and digital automation solutions including AutoREX™.",

  keywords: [
    "Rotehügels",
    "Hydrometallurgy",
    "Battery Recycling",
    "Critical Minerals",
    "Copper Extraction",
    "Zinc Dross Recycling",
    "Process Plant EPC",
    "AutoREX",
    "Industrial Automation",
    "Metallurgy Consulting"
  ],

  authors: [{ name: "Sivakumar Shanmugam" }],
  creator: "Rotehügels",
  publisher: "Rotehügel Research Business Consultancy Pvt. Ltd.",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Rotehügels",
    description: "Where Research Meets Business Excellence.",
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
    title: "Rotehügels",
    description: "Where Research Meets Business Excellence.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
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
        <AuraBackground />
        <Header />
        <TickerBar />
        <main>{children}</main>
        <Footer />
        <AssistWidget />
      </body>
    </html>
  )
}