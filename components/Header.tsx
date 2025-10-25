'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // detect mount for portals
  useEffect(() => setMounted(true), []);

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
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction as string;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction || '';
    };
  }, [open]);

  // Navigation (suppliers removed)
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
    <>
      <header
        className={[
          'sticky top-0 z-[90] border-b border-white/10 backdrop-blur transition-colors duration-300',
          scrolled ? 'bg-black/80' : 'bg-black/40',
        ].join(' ')}
      >
        <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/logo.png" alt="Rotehügels logo" width={140} height={40} priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={linkClasses(n.href)}>
                {n.label}
              </Link>
            ))}
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
      </header>

      {/* Mobile FULL-SCREEN, OPAQUE menu rendered via PORTAL */}
      {mounted &&
        createPortal(
          <>
            <div
              id="mobile-menu"
              className={[
                'fixed inset-0 z-[9999] md:hidden', // super high z-index
                'bg-black', // fully opaque
                'transform transition-transform duration-200',
                open ? 'translate-x-0' : 'translate-x-full',
                'flex flex-col', // column layout
              ].join(' ')}
              role="dialog"
              aria-modal="true"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
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

              {/* Centered navigation list */}
              <nav className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center overflow-y-auto">
                {nav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={`text-lg py-2 font-medium transition-colors ${
                      pathname === n.href
                        ? 'text-red-400 font-semibold'
                        : 'text-zinc-200 hover:text-red-300'
                    }`}
                  >
                    {n.label}
                  </Link>
                ))}
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-block rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-500 transition-colors"
                >
                  Get in Touch
                </Link>
              </nav>
            </div>

            {/* Optional scrim (below menu); can be left out but harmless */}
            {open && (
              <button
                aria-hidden="true"
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[9998] md:hidden bg-black/40"
              />
            )}
          </>,
          document.body
        )}
    </>
  );
}