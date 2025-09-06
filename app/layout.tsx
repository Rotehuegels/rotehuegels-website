import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TickerBar from '@/components/TickerBar'

export const metadata: Metadata = {
  title: 'Rotehügels - Where Research Meets Business Excellence',
  description: 'Rotehugel Research Business Consultancy Private Limited, Chennai, India. Research, Business, Consultancy in extractive metallurgy, critical minerals, and circular economy.',
  openGraph: {
    title: 'Rotehügels',
    description: 'Where Research Meets Business Excellence.',
    url: 'https://www.rotehuegels.com',
    siteName: 'Rotehügels',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <TickerBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
