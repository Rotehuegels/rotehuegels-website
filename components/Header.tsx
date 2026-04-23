'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

type Child = { label: string; href: string; highlight?: boolean };
type NavItem = { label: string; href?: string; children?: Child[] };

const NAV: NavItem[] = [
  {
    label: 'About',
    children: [
      { label: 'About Us',              href: '/about' },
      { label: 'The Rotehügels Story',  href: '/rotehuegels-story' },
      { label: 'Current Updates',       href: '/current-updates' },
      { label: 'Success Stories',       href: '/success-stories' },
    ],
  },
  {
    label: 'Engineering',
    children: [
      { label: 'Overview',                    href: '/services' },
      { label: 'Plant EPC',                   href: '/services/plant-epc' },
      { label: 'Custom Anodes & Cathodes',    href: '/services/custom-electrodes' },
      { label: 'Testwork & Feasibility',      href: '/services/testwork-feasibility' },
      { label: 'Operations Advisory',         href: '/services/operations-advisory' },
      { label: 'Severe-Service Valves',       href: '/services/severe-service-valves' },
    ],
  },
  {
    label: 'AutoREX',
    children: [
      { label: 'Platform Overview',  href: '/digital-solutions' },
      { label: 'AutoREX™ — automation & digital twin', href: '/digital-solutions#autorex' },
      { label: 'Operon — ERP',       href: '/digital-solutions#operon' },
      { label: 'LabREX — LIMS',      href: '/digital-solutions#labrex' },
    ],
  },
  {
    label: 'Circular',
    children: [
      { label: 'Overview',                    href: '/circular' },
      { label: 'Ecosystem Directory',         href: '/ecosystem' },
      { label: 'EPR & Pickups',               href: '/recycling' },
    ],
  },
  {
    label: 'Join Us',
    children: [
      { label: 'REX Network',             href: '/rex',                        highlight: true },
      { label: 'Customer Registration',   href: '/customers/register' },
      { label: 'Supplier Registration',   href: '/suppliers/register' },
      { label: 'Trading Partner',         href: '/trading/register' },
      { label: 'Recycler Registration',   href: '/recycling/recycler-register' },
      { label: 'Careers',                 href: '/careers' },
    ],
  },
];

export default function Header() {
  const pathname  = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [activeDropdown, setActive]   = useState<string | null>(null);
  const [mobileExpanded, setExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled]       = useState(false);
  const [mounted, setMounted]         = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close dropdown on route change
  useEffect(() => { setActive(null); setMobileOpen(false); }, [pathname]);

  const isActive = (item: NavItem) => {
    if (item.href) return pathname === item.href;
    return item.children?.some(c => pathname === c.href) ?? false;
  };

  return (
    <>
      <header className={[
        'sticky top-0 z-[1000] border-b border-white/10 backdrop-blur transition-colors duration-300',
        scrolled ? 'bg-black/50' : 'bg-black/20',
      ].join(' ')}>
        <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline relative z-[1001]">
            <Image src="/logo.png" alt="Rotehügels logo" width={140} height={40} priority />
          </Link>

          {/* Desktop nav */}
          <nav ref={navRef} className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              item.href ? (
                <Link key={item.label} href={item.href}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive(item)
                      ? 'text-red-400 font-semibold'
                      : 'text-zinc-200 hover:text-white hover:bg-white/5'
                  }`}>
                  {item.label}
                </Link>
              ) : (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setActive(activeDropdown === item.label ? null : item.label)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive(item) || activeDropdown === item.label
                        ? 'text-red-400 font-semibold'
                        : 'text-zinc-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      activeDropdown === item.label ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Dropdown */}
                  {activeDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1.5 min-w-[200px] rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl py-1.5 z-50">
                      {item.children?.map((child) => (
                        <Link key={child.href} href={child.href}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                            child.highlight
                              ? 'text-rose-300 hover:bg-rose-500/10'
                              : pathname === child.href
                              ? 'text-red-400 font-medium bg-white/5'
                              : 'text-zinc-300 hover:text-white hover:bg-white/5'
                          }`}>
                          {child.highlight && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                          )}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}

            <Link href="/contact"
              className="ml-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors">
              Get in Touch
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden relative z-[1001] p-2 rounded hover:bg-white/5 active:scale-95 transition"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-7 w-7 text-white" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mounted && createPortal(
        <div className={[
          'fixed inset-0 z-[9999] md:hidden flex flex-col bg-black transition-transform duration-300 ease-in-out overflow-y-auto',
          mobileOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none',
        ].join(' ')}>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/logo.png" alt="" width={300} height={100} className="opacity-5" priority />
          </div>

          {/* Drawer header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-white/10">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Image src="/logo.png" alt="Rotehügels logo" width={120} height={34} />
            </Link>
            <button type="button" onClick={() => setMobileOpen(false)}
              className="p-2 rounded hover:bg-white/5 transition" aria-label="Close menu">
              <X className="h-7 w-7 text-white" />
            </button>
          </div>

          {/* Drawer nav */}
          <nav className="relative z-10 flex-1 px-4 py-6 space-y-1">
            {NAV.map((item) => (
              item.href ? (
                <Link key={item.label} href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-red-400 bg-white/5'
                      : 'text-zinc-200 hover:text-white hover:bg-white/5'
                  }`}>
                  {item.label}
                </Link>
              ) : (
                <div key={item.label}>
                  <button
                    onClick={() => setExpanded(mobileExpanded === item.label ? null : item.label)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive(item) || mobileExpanded === item.label
                        ? 'text-red-400 bg-white/5'
                        : 'text-zinc-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      mobileExpanded === item.label ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {mobileExpanded === item.label && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-4">
                      {item.children?.map((child) => (
                        <Link key={child.href} href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            child.highlight
                              ? 'text-rose-300 hover:bg-rose-500/10'
                              : pathname === child.href
                              ? 'text-red-400 font-medium'
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }`}>
                          {child.highlight && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                          )}
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}

            <div className="pt-4">
              <Link href="/contact" onClick={() => setMobileOpen(false)}
                className="block text-center rounded-xl bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-500 transition-colors">
                Get in Touch
              </Link>
            </div>
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}
