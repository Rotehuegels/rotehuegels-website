'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Minimize2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import WebLLMAssistant from './WebLLMAssistant';

const IDLE_MS = 5_000;

// ── Page-aware context map ──────────────────────────────────────────────────
type Ctx = {
  emoji: string;
  ring: string;        // Tailwind ring colour
  glow: string;        // shadow glow colour
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

const CTX_MAP: Array<{ match: (p: string) => boolean; ctx: Ctx }> = [
  {
    match: p => p === '/rex' || p.startsWith('/rex/'),
    ctx: {
      emoji: '🌐', ring: 'ring-violet-500/70', glow: 'shadow-violet-900/60',
      title: 'Join the REX Network!',
      body: 'REX connects critical-minerals experts, entrepreneurs & enthusiasts worldwide. Registration is free — sign up and we\'ll reach out when the right opportunity appears.',
      cta: { label: 'Register for REX →', href: '/rex' },
    },
  },
  {
    match: p => p.startsWith('/suppliers/register'),
    ctx: {
      emoji: '📝', ring: 'ring-emerald-500/70', glow: 'shadow-emerald-900/60',
      title: 'Supplier Registration',
      body: 'Fill in your company details and we\'ll contact you when your categories match our procurement needs.',
    },
  },
  {
    match: p => p.startsWith('/suppliers'),
    ctx: {
      emoji: '🤝', ring: 'ring-emerald-500/70', glow: 'shadow-emerald-900/60',
      title: 'Become a Supplier!',
      body: 'Register your company with Rotehügels. When your materials or services match a live procurement need we\'ll reach out directly.',
      cta: { label: 'Register as Supplier →', href: '/suppliers/register' },
    },
  },
  {
    match: p => p === '/careers' || p.startsWith('/careers/'),
    ctx: {
      emoji: '🚀', ring: 'ring-amber-500/70', glow: 'shadow-amber-900/60',
      title: 'Careers at Rotehügels',
      body: 'Found a role that excites you? Apply directly. Also join the REX Network — we contact members first whenever a relevant opportunity opens up.',
      cta: { label: 'Join REX Network →', href: '/rex' },
    },
  },
  {
    match: p => p === '/about' || p.startsWith('/about/'),
    ctx: {
      emoji: '🏭', ring: 'ring-sky-500/70', glow: 'shadow-sky-900/60',
      title: 'Our Story',
      body: 'Rotehügels was built to close the gap between laboratory science and industrial execution — hydrometallurgy, EPC, and circular economy under one roof.',
    },
  },
  {
    match: p => p === '/services' || p.startsWith('/services/'),
    ctx: {
      emoji: '⚙️', ring: 'ring-rose-500/70', glow: 'shadow-rose-900/60',
      title: 'What We Offer',
      body: 'Research → EPC → Consultancy. From pilot design and process modelling to turnkey greenfield plants and techno-economic advisory.',
      cta: { label: 'Book a Discovery Call →', href: '/contact' },
    },
  },
  {
    match: p => p === '/contact' || p.startsWith('/contact/'),
    ctx: {
      emoji: '📬', ring: 'ring-sky-500/70', glow: 'shadow-sky-900/60',
      title: "Let's Talk!",
      body: "Fill out the form and we'll get back within 24 hours. Or type your question here and I'll answer right away.",
    },
  },
  {
    match: p => p === '/digital-solutions' || p.startsWith('/digital-solutions/'),
    ctx: {
      emoji: '🤖', ring: 'ring-violet-500/70', glow: 'shadow-violet-900/60',
      title: 'Digital & AI Solutions',
      body: 'AutoREX™, AI-driven process models, digital twins, and decision-support systems for industrial operations and critical-minerals projects.',
    },
  },
  {
    match: p => p === '/success-stories' || p.startsWith('/success-stories/'),
    ctx: {
      emoji: '🏆', ring: 'ring-amber-500/70', glow: 'shadow-amber-900/60',
      title: 'Our Track Record',
      body: 'Greenfield concentrators in Zambia, recycling pilots in India — real outcomes delivered on time and within budget.',
    },
  },
];

const DEFAULT_CTX: Ctx = {
  emoji: '👋', ring: 'ring-rose-500/60', glow: 'shadow-rose-900/50',
  title: 'Welcome to Rotehügels!',
  body: 'We deliver research, engineering & execution for critical minerals, metallurgy, and circular economy projects worldwide.',
  cta: { label: 'Explore our services →', href: '/services' },
};

function getCtx(pathname: string): Ctx {
  for (const { match, ctx } of CTX_MAP) {
    if (match(pathname)) return ctx;
  }
  return DEFAULT_CTX;
}

// ── Illustrated SVG avatar ──────────────────────────────────────────────────
// A detailed, professional, gender-neutral illustrated face
function IllustratedFace({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill="none" aria-hidden>
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#1c1c22" />

      {/* Jacket / shoulders */}
      <path d="M10 100 Q10 72 50 70 Q90 72 90 100Z" fill="#1e3a5f" />
      {/* Shirt / collar */}
      <path d="M38 70 L50 84 L62 70 Q56 68 50 68 Q44 68 38 70Z" fill="#ffffff" />
      {/* Tie hint */}
      <path d="M50 72 L47 82 L50 86 L53 82Z" fill="#e11d48" />

      {/* Neck */}
      <rect x="43" y="58" width="14" height="14" rx="6" fill="#c8956c" />

      {/* Head */}
      <ellipse cx="50" cy="42" rx="22" ry="24" fill="#c8956c" />

      {/* Hair — short, professional */}
      <path d="M28 38 Q28 18 50 17 Q72 18 72 38 Q72 28 60 25 Q50 22 40 25 Q30 28 28 38Z" fill="#2c1a0e" />
      {/* Side hair */}
      <path d="M28 38 Q26 44 28 50 Q28 42 30 39Z" fill="#2c1a0e" />
      <path d="M72 38 Q74 44 72 50 Q72 42 70 39Z" fill="#2c1a0e" />

      {/* Ear left */}
      <ellipse cx="28" cy="44" rx="4" ry="5.5" fill="#b87c52" />
      <path d="M29 41 Q27 44 29 47" stroke="#a06040" strokeWidth="1" fill="none" />
      {/* Ear right */}
      <ellipse cx="72" cy="44" rx="4" ry="5.5" fill="#b87c52" />
      <path d="M71 41 Q73 44 71 47" stroke="#a06040" strokeWidth="1" fill="none" />

      {/* Eyebrows */}
      <path d="M36 33 Q40 30 44 32" stroke="#2c1a0e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M56 32 Q60 30 64 33" stroke="#2c1a0e" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Eyes — white */}
      <ellipse cx="40" cy="39" rx="5.5" ry="4.5" fill="white" />
      <ellipse cx="60" cy="39" rx="5.5" ry="4.5" fill="white" />
      {/* Iris */}
      <circle cx="40" cy="39" r="3" fill="#3b2a1a" />
      <circle cx="60" cy="39" r="3" fill="#3b2a1a" />
      {/* Pupil */}
      <circle cx="40" cy="39" r="1.5" fill="#111" />
      <circle cx="60" cy="39" r="1.5" fill="#111" />
      {/* Eye shine */}
      <circle cx="41.5" cy="37.5" r="0.9" fill="white" />
      <circle cx="61.5" cy="37.5" r="0.9" fill="white" />

      {/* Nose */}
      <path d="M50 43 Q47 50 48 52 Q50 54 52 52 Q53 50 50 43Z" fill="#b87c52" />
      <path d="M47 52 Q44 54 45 55.5 Q47 57 50 56.5 Q53 57 55 55.5 Q56 54 53 52" stroke="#a06040" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Mouth — friendly smile */}
      <path d="M41 60 Q50 67 59 60" stroke="#7a3c28" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Lip bottom */}
      <path d="M44 62 Q50 66 56 62" stroke="#c06040" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Cheek blush */}
      <ellipse cx="33" cy="55" rx="5" ry="3" fill="#e8a090" opacity="0.25" />
      <ellipse cx="67" cy="55" rx="5" ry="3" fill="#e8a090" opacity="0.25" />
    </svg>
  );
}

// ── Avatar button wrapper ───────────────────────────────────────────────────
function AvatarBubble({ ring, glow, emoji }: { ring: string; glow: string; emoji: string }) {
  return (
    <div className="relative w-14 h-14">
      {/* Pulsing rings */}
      <span className={`rh-pulse  absolute inset-0 rounded-full ring-2 ${ring}`} />
      <span className={`rh-pulse-2 absolute inset-0 rounded-full ring-1 ${ring} opacity-50`} />
      {/* Face circle */}
      <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${ring} shadow-lg ${glow} transition-all duration-500`}>
        <IllustratedFace size={56} />
      </div>
      {/* Online dot */}
      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950 z-10" />
      {/* Emoji badge */}
      <span key={emoji} className="rh-pop-in absolute -top-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[13px] z-10 shadow">
        {emoji}
      </span>
    </div>
  );
}

// ── Main widget ─────────────────────────────────────────────────────────────
export default function AssistWidget() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [showGreet, setShowGreet] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [ctx, setCtx] = useState<Ctx>(getCtx(pathname));
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't render inside the dashboard
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) return null;

  // Update context and re-trigger greeting on route change
  useEffect(() => {
    const newCtx = getCtx(pathname);
    setCtx(newCtx);
    if (!open) {
      setShowGreet(false);
      if (greetRef.current) clearTimeout(greetRef.current);
      greetRef.current = setTimeout(() => setShowGreet(true), 1500);
    }
    return () => { if (greetRef.current) clearTimeout(greetRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Initial greeting on mount
  useEffect(() => {
    greetRef.current = setTimeout(() => setShowGreet(true), 1800);
    return () => { if (greetRef.current) clearTimeout(greetRef.current); };
  }, []);

  // 5s idle → wiggle
  const resetIdle = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    setNudge(false);
    if (!open) {
      idleRef.current = setTimeout(() => setNudge(true), IDLE_MS);
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">

      {/* ── Expanded chat panel ── */}
      {open && (
        <div className="rh-panel pointer-events-auto w-[360px] max-h-[580px] rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/70 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-rose-500/50 shrink-0">
                <IllustratedFace size={36} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Rotehügels Assist</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">Available 24 / 7</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Minimise">
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
          {/* Context hint bar */}
          <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/60 text-xs text-zinc-500">
            {ctx.emoji} <span className="text-zinc-400">{ctx.title}</span>
          </div>
          {/* Chat */}
          <div className="flex-1 overflow-y-auto p-4">
            <WebLLMAssistant />
          </div>
        </div>
      )}

      {/* ── Collapsed bubble ── */}
      {!open && (
        <div className="flex flex-col items-end gap-2.5">
          {/* Greeting bubble */}
          {showGreet && (
            <div key={pathname} className="rh-greet pointer-events-auto max-w-[230px] rounded-2xl rounded-br-none border border-zinc-700/80 bg-zinc-900/98 shadow-xl px-4 py-3.5 space-y-1.5">
              <p className="text-sm font-bold text-white leading-snug">
                {ctx.emoji} {ctx.title}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {ctx.body}
              </p>
              {ctx.cta && (
                <Link
                  href={ctx.cta.href}
                  className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors no-underline"
                  onClick={() => setShowGreet(false)}
                >
                  {ctx.cta.label} <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <button
                onClick={() => { setOpen(true); setShowGreet(false); setNudge(false); }}
                className="block w-full mt-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors text-center"
              >
                Ask me anything
              </button>
            </div>
          )}

          {/* Avatar button */}
          <button
            onClick={() => { setOpen(true); setShowGreet(false); setNudge(false); }}
            aria-label="Open Rotehügels Assist"
            className={`pointer-events-auto transition-transform duration-200 hover:scale-110 active:scale-95 ${nudge ? 'rh-nudge' : ''}`}
          >
            <AvatarBubble ring={ctx.ring} glow={ctx.glow} emoji={ctx.emoji} />
          </button>
        </div>
      )}
    </div>
  );
}
