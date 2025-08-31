import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LiveTicker from '@/components/LiveTicker'

export const metadata: Metadata = {
  title: 'Rotehuegels — Where Research Meets Business Excellence',
  description: 'Rotehuegel Research Business Consultancy Private Limited, Chennai, India. Research, Business, Consultancy in extractive metallurgy, critical minerals, and circular economy.',
  metadataBase: new URL('https://www.rotehuegels.com'),
  openGraph: {
    title: 'Rotehuegels',
    description: 'Where Research Meets Business Excellence.',
    url: 'https://www.rotehuegels.com',
    siteName: 'Rotehuegels',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' }
}

export default function RootLayout({ children }:{children: React.ReactNode}){
  return (
    <html lang="en">
      <body>
        <Header />
        <LiveTicker />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
