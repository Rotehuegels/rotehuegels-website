import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 shadow-md bg-white dark:bg-neutral-900">
      {/* Left side: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image 
          src="/logo.png"  // or /logo.svg
          alt="Rotehuegels Logo"
          width={40}
          height={40}
        />
        <span className="font-bold text-lg">Rotehuegels</span>
      </Link>

      {/* Right side: Menu */}
      <div className="flex gap-6">
        <Link href="/">Home</Link>
        <Link href="/about">About Us</Link>
        <Link href="/services">Services</Link>
        <Link href="/suppliers">Suppliers</Link>
        <Link href="/current-updates">Updates</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  )
}