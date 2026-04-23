'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

type DropdownItem = { href: string; label: string; desc?: string };
type NavItem = { label: string; href?: string; items?: DropdownItem[] };

const NAV: NavItem[] = [
  {
    label: 'Engineering',
    items: [
      { href: '/services/plant-epc', label: 'Plant EPC', desc: 'Turnkey plant delivery — design, procurement, commissioning' },
      { href: '/services/custom-electrodes', label: 'Custom Anodes & Cathodes', desc: 'Electrodes engineered to your cell chemistry' },
      { href: '/services/testwork-feasibility', label: 'Testwork & Feasibility', desc: 'Bench-to-pilot R&D and bankable studies' },
      { href: '/services/operations-advisory', label: 'Operations Advisory', desc: 'Process audits, debottlenecking, SOPs' },
      { href: '/services/severe-service-valves', label: 'Severe-Service Valves', desc: 'High-integrity valves for corrosive and high-temperature duty' },
      { href: '/services', label: 'All Engineering services →' },
    ],
  },
  {
    label: 'AutoREX',
    items: [
      { href: '/digital-solutions#autorex', label: 'AutoREX™ Core', desc: 'Plant automation, AI anomaly detection, digital twin, SCADA/DCS/PLC bridge' },
      { href: '/digital-solutions#operon', label: 'Operon', desc: 'Full SaaS ERP — accounts, HR, procurement, compliance' },
      { href: '/digital-solutions#labrex', label: 'LabREX', desc: 'Multi-industry LIMS with instrument integration' },
      { href: '/digital-solutions', label: 'The full AutoREX suite →' },
    ],
  },
  {
    label: 'Circular',
    items: [
      { href: '/ecosystem', label: 'Ecosystem Directory', desc: '1,300+ verified facilities across the circular chain' },
      { href: '/marketplace', label: 'Marketplace', desc: 'Generators ↔ licensed recyclers — matched by fit' },
      { href: '/recycling', label: 'EPR & Pickups', desc: 'Compliance, traceability, EPR-fulfilment certificates' },
      { href: '/circular', label: 'Circular overview →' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Story', href: '/rotehuegels-story' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [openMobile, setOpenMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-white/10">
      <div className="container mx-auto px-4 lg:px-6 flex items-center justify-between h-14">

        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <Image src="/logo.png" alt="Rotehügels" width={32} height={32} />
          <span className="font-bold text-white text-sm md:text-base">Rotehügels</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV.map(item =>
            item.items ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="px-3 py-2 text-sm text-zinc-300 hover:text-white inline-flex items-center gap-1">
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                {openDropdown === item.label && (
                  <div className="absolute left-0 top-full pt-1 w-[360px]">
                    <div className="rounded-xl border border-white/10 bg-zinc-900/98 backdrop-blur shadow-2xl overflow-hidden">
                      {item.items.map(sub => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-4 py-3 hover:bg-rose-500/10 hover:text-rose-200 transition-colors no-underline border-b border-white/5 last:border-0"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div className="text-sm font-semibold text-white">{sub.label}</div>
                          {sub.desc && <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{sub.desc}</div>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.label} href={item.href!} className="px-3 py-2 text-sm text-zinc-300 hover:text-white no-underline">
                {item.label}
              </Link>
            ),
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/customers/register" className="px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 no-underline">
            Register
          </Link>
          <Link href="/contact" className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white no-underline transition-colors">
            Start a conversation
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-zinc-300"
          aria-label="Toggle menu"
          onClick={() => setOpenMobile(v => !v)}
        >
          {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel */}
      {openMobile && (
        <div className="lg:hidden border-t border-white/10 bg-zinc-950/98 backdrop-blur">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {NAV.map(item =>
              item.items ? (
                <details key={item.label} className="group">
                  <summary className="flex items-center justify-between px-3 py-2 text-sm text-zinc-200 cursor-pointer list-none">
                    <span>{item.label}</span>
                    <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="pl-3 mt-1 space-y-0.5">
                    {item.items.map(sub => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block px-3 py-2 text-sm text-zinc-400 hover:text-white no-underline"
                        onClick={() => setOpenMobile(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  className="block px-3 py-2 text-sm text-zinc-200 hover:text-white no-underline"
                  onClick={() => setOpenMobile(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
            <div className="pt-3 mt-3 border-t border-white/10 flex gap-2">
              <Link href="/customers/register" className="flex-1 text-center px-3 py-2 text-xs text-rose-300 border border-rose-500/30 rounded-lg no-underline" onClick={() => setOpenMobile(false)}>
                Register
              </Link>
              <Link href="/contact" className="flex-1 text-center px-3 py-2 text-xs font-semibold rounded-lg bg-rose-500 text-white no-underline" onClick={() => setOpenMobile(false)}>
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
