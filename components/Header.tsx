'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/services', label: 'Services' },
    { href: '/success-stories', label: 'Success Stories' },
    { href: '/suppliers', label: 'Suppliers' },
    { href: '/current-updates', label: 'Current Updates' },
    { href: '/careers', label: 'Careers' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close drawer when navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${
        scrolled ? 'shadow-md shadow-black/30' : ''
      } border-b border-white/10 bg-black/40 backdrop-blur`}
    >
      <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/logo.png"
            alt="Rotehuegels logo"
            width={140}
            height={40}
            priority
          />
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`no-underline hover:underline ${
                pathname === n.href ? 'text-rose-500 font-medium' : ''
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-4 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition no-underline"
          >
            Get in Touch
          </Link>
        </nav>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div className="md:hidden bg-black/95 backdrop-blur border-t border-white/10">
          <div className="flex flex-col items-start p-4 space-y-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`no-underline hover:underline ${
                  pathname === n.href ? 'text-rose-500 font-medium' : ''
                }`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition no-underline w-full text-center"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}