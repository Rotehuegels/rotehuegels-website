import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 shadow-md bg-white dark:bg-neutral-900">
      
      {/* Left side: Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <Image
          src="/logo.png"
          alt="Rotehuegels Logo"
          width={40}
          height={40}
        />
        <span className="font-bold text-lg">Rotehuegels</span>
      </Link>

      {/* Right side: Menu */}
      <div className="flex items-center gap-6">
        <Link href="/" className="no-underline hover:underline">Home</Link>
        
        <Link href="/about" className="no-underline hover:underline">
          About Us
        </Link>

        <Link href="/services" className="no-underline hover:underline">
          Services
        </Link>

        <Link href="/digital-solutions" className="no-underline hover:underline">
          Digital Solutions
        </Link>

        {/* 🔥 REX PRIMARY CTA */}
        <Link
          href="/rex"
          className="px-4 py-2 bg-black text-white rounded-lg font-semibold shadow-sm hover:opacity-90 transition"
        >
          Join REX
        </Link>

        <Link href="/current-updates" className="no-underline hover:underline">
          Updates
        </Link>

        <Link href="/rotehugels-story" className="no-underline hover:underline">
          The Rotehügels Story
        </Link>

        <Link href="/contact" className="no-underline hover:underline">
          Contact
        </Link>

        <Link href="/careers" className="no-underline hover:underline">
          Careers
        </Link>
      </div>
    </nav>
  )
}