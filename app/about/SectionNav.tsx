'use client';

import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#who-we-are', label: 'Who We Are' },
  { href: '#technology',  label: 'Technology' },
  { href: '#industries',  label: 'Industries' },
  { href: '#leadership',  label: 'Leadership' },
  { href: '#delivery',    label: 'What We Deliver' },
  { href: '#vision',      label: 'Vision' },
];

export default function SectionNav() {
  const [active, setActive] = useState<string>(LINKS[0].href);

  useEffect(() => {
    const elements = LINKS
      .map(l => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // A section becomes active when its top crosses below the sticky nav
    // (~64 px main header + ~40 px sub-nav = ~104 px from viewport top).
    // Bottom margin of -55% keeps the previous section "owning" the slot
    // until the next one reaches the upper threshold — feels natural.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive('#' + visible[0].target.id);
        }
      },
      { rootMargin: '-110px 0px -55% 0px', threshold: 0 },
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-16 z-40 border-y border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ul className="flex gap-1 overflow-x-auto py-2 text-sm whitespace-nowrap scrollbar-none">
          {LINKS.map((l) => {
            const isActive = active === l.href;
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={
                    'inline-block rounded-lg px-3 py-1.5 transition-colors ' +
                    (isActive
                      ? 'bg-rose-500/15 text-rose-300 font-medium'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white')
                  }
                >
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
