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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [open]);

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/services', label: 'Services' },
    { href: '/digital-solutions', label: 'Digital Solutions' },
    { href: '/success-stories', label: 'Success Stories' },
    { href: '/current-updates', label: 'Current Updates' },
    { href: '/rotehuegels-story', label: 'The Rotehügels Story' },
    { href: '/careers', label: 'Careers' },
    { href: '/rex', label: 'REX Network', highlight: true },
  ];

  const linkClasses = (href: string) =>
    [
      'px-2 py-1 text-sm transition-colors',
      pathname === href
        ? 'text-red-500 font-semibold border-b-2 border-red-500'
        : 'text-zinc-200 hover:text-red-400',
    ].join(' ');

  type NavItem = { href: string; label: string; highlight?: boolean };

  return (
    <>
      <header
        className={[
          'sticky top-0 z-[1000] border-b border-white/10 backdrop-blur transition-colors duration-300',
          scrolled ? 'bg-black/50' : 'bg-black/20',
        ].join(' ')}
      >
        <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 no-underline relative z-[1001]">
            <Image src="/logo.png" alt="Rotehügels logo" width={140} height={40} priority />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n: NavItem) => (
              n.highlight ? (
                <Link key={n.href} href={n.href}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/40 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  {n.label}
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                </Link>
              ) : (
                <Link key={n.href} href={n.href} className={linkClasses(n.href)}>
                  {n.label}
                </Link>
              )
            ))}

            <Link
              href="/contact"
              className="ml-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
            >
              Get in Touch
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden relative z-[1001] p-2 rounded hover:bg-white/5 active:scale-95 transition"
            onClick={() => {
              console.log('MENU CLICKED');
              setOpen(true);
            }}
            aria-label="Open menu"
          >
            <Menu className="h-7 w-7 text-white" />
          </button>
        </div>
      </header>

      {mounted &&
        createPortal(
          <div
            className={[
              'fixed inset-0 z-[9999] md:hidden flex flex-col overflow-hidden bg-black transition-transform duration-300 ease-in-out',
              open ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none',
            ].join(' ')}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Image
                src="/logo.png"
                alt="Watermark Logo"
                width={300}
                height={100}
                className="opacity-5"
                priority
              />
            </div>

            <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-white/10">
              <Link href="/" onClick={() => setOpen(false)}>
                <Image src="/logo.png" alt="Rotehügels logo" width={120} height={34} />
              </Link>

              <button
                type="button"
                className="p-2 rounded hover:bg-white/5 active:scale-95 transition"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-7 w-7 text-white" />
              </button>
            </div>

            <nav className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              {nav.map((n: NavItem) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={[
                    'text-lg py-2 font-medium transition-colors',
                    n.highlight
                      ? 'text-rose-400 font-semibold'
                      : pathname === n.href
                      ? 'text-red-400 font-semibold'
                      : 'text-zinc-200 hover:text-red-300',
                  ].join(' ')}
                >
                  {n.label}
                  {n.highlight && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse align-middle" />}
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
          </div>,
          document.body
        )}
    </>
  );
}