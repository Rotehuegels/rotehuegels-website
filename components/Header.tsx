'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Solidify header on scroll for readability
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ✅ Suppliers removed
  const nav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/services', label: 'Services' },
    { href: '/success-stories', label: 'Success Stories' },
    { href: '/current-updates', label: 'Current Updates' },
    { href: '/rotehuegels-story', label: 'The Rotehügels Story' },
    { href: '/careers', label: 'Careers' },
  ];

  const linkClasses = (href: string) =>
    [
      'px-2 py-1 text-sm transition-colors',
      pathname === href
        ? 'text-red-500 font-semibold border-b-2 border-red-500'
        : 'text-zinc-200 hover:text-red-400',
    ].join(' ');

  return (
    <header
      className={[
        // raise header above tickers etc.
        'sticky top-0 z-[90] border-b border-white/10 backdrop-blur transition-colors duration-300',
        scrolled ? 'bg-black/80' : 'bg-black/40',
      ].join(' ')}
    >
      <div
        className="container mx-auto flex items-center justify-between py-3 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/logo.png"
            alt="Rotehügels logo"
            width={140}
            height={40}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={linkClasses(n.href)}>
              {n.label}
            </Link>
          ))}

          {/* Primary CTA */}
          <Link
            href="/contact"
            className="ml-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Get in Touch
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/5"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <Menu />
        </button>
      </div>

      {/* Mobile full-screen overlay menu */}
      <div
        id="mobile-menu"
        className={[
          'fixed inset-0 z-[100] md:hidden',
          'bg-black/95 backdrop-blur-md border-l border-white/10',
          'transform transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
          'overflow-y-auto', // scroll menu content if needed
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
            <Image src="/logo.png" alt="Rotehügels logo" width={120} height={34} />
          </Link>
          <button
            className="p-2 rounded hover:bg-white/5"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        {/* Menu list */}
        <nav className="flex flex-col gap-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={[
                'rounded-md px-4 py-4 text-base',
                pathname === n.href
                  ? 'text-red-400 font-semibold bg-white/5'
                  : 'text-zinc-200 hover:bg-white/5 hover:text-red-300',
              ].join(' ')}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-lg bg-red-600 px-4 py-4 text-base font-semibold text-white text-center hover:bg-red-500 transition-colors"
          >
            Get in Touch
          </Link>
        </nav>
      </div>

      {/* Scrim behind menu (click to close) */}
      {open && (
        <button
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[95] bg-black/40 md:hidden"
        />
      )}
    </header>
  );
}