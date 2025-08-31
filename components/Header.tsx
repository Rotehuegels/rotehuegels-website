'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function Header(){
  const [open, setOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/services', label: 'Services' },
    { href: '/success-stories', label: 'Success Stories' },
    { href: '/suppliers', label: 'Suppliers' },
    { href: '/current-updates', label: 'Current Updates' },
    { href: '/contact', label: 'Contact Us' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image src="/logo.png" alt="Rotehuegels logo" width={140} height={40} priority />
          {/* If your logo image already includes text, you can remove this span */}
          {/* <span className="font-bold text-lg md:text-xl">Rotehuegels</span> */}
        </Link>

        <button className="md:hidden p-2" onClick={()=>setOpen(!open)} aria-label="Menu">
          <Menu />
        </button>
        <nav className={`md:flex gap-6 ${open?'block':'hidden'} md:block`}>
          {nav.map(n=>(
            <Link key={n.href} href={n.href} className="no-underline hover:underline">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}