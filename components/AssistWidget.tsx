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

// ── Tamil woman 3D avatar ───────────────────────────────────────────────────
function Avatar3D({ size = 56 }: { size?: number }) {
  const id = 'rha';
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} fill="none" aria-hidden>
      <defs>
        {/* Background */}
        <radialGradient id={`${id}-bg`} cx="45%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2a1535" />
          <stop offset="100%" stopColor="#0d0812" />
        </radialGradient>
        {/* Deep warm Tamil skin — light from upper-left */}
        <radialGradient id={`${id}-sk`} cx="34%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#f0b07a" />
          <stop offset="28%"  stopColor="#c87238" />
          <stop offset="65%"  stopColor="#984e18" />
          <stop offset="100%" stopColor="#5a2808" />
        </radialGradient>
        {/* Skin shadow — far side */}
        <radialGradient id={`${id}-skd`} cx="82%" cy="78%" r="52%">
          <stop offset="0%"   stopColor="#3a1006" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#3a1006" stopOpacity="0" />
        </radialGradient>
        {/* Neck */}
        <linearGradient id={`${id}-nk`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7a3a10" />
          <stop offset="45%"  stopColor="#be6e30" />
          <stop offset="100%" stopColor="#6a2e0c" />
        </linearGradient>
        {/* Ear */}
        <radialGradient id={`${id}-ear`} cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#d89050" />
          <stop offset="100%" stopColor="#7a3810" />
        </radialGradient>
        {/* Hair — black with subtle blue sheen */}
        <radialGradient id={`${id}-hr`} cx="36%" cy="18%" r="68%">
          <stop offset="0%"   stopColor="#3c2410" />
          <stop offset="40%"  stopColor="#130b04" />
          <stop offset="100%" stopColor="#060402" />
        </radialGradient>
        {/* Kondai (bun) */}
        <radialGradient id={`${id}-bn`} cx="35%" cy="28%" r="62%">
          <stop offset="0%"   stopColor="#2e1a08" />
          <stop offset="100%" stopColor="#060402" />
        </radialGradient>
        {/* Eye iris — very dark brown */}
        <radialGradient id={`${id}-ir`} cx="30%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#4e2808" />
          <stop offset="55%"  stopColor="#180c04" />
          <stop offset="100%" stopColor="#040202" />
        </radialGradient>
        {/* Eyeball */}
        <radialGradient id={`${id}-ew`} cx="30%" cy="25%" r="65%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d4cfc8" />
        </radialGradient>
        {/* Lips — rose-red */}
        <linearGradient id={`${id}-lp`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#c03050" />
          <stop offset="100%" stopColor="#8a1c30" />
        </linearGradient>
        {/* Kanjivaram saree — deep teal/peacock */}
        <linearGradient id={`${id}-sr`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0e6070" />
          <stop offset="55%"  stopColor="#084050" />
          <stop offset="100%" stopColor="#042838" />
        </linearGradient>
        {/* Saree drape (pallu) */}
        <linearGradient id={`${id}-pl`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#145870" />
          <stop offset="100%" stopColor="#063040" />
        </linearGradient>
        {/* Gold zari */}
        <linearGradient id={`${id}-gd`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#f8d060" />
          <stop offset="50%"  stopColor="#e8a820" />
          <stop offset="100%" stopColor="#c88010" />
        </linearGradient>
        {/* Specular on head */}
        <radialGradient id={`${id}-sp`} cx="30%" cy="24%" r="30%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.28" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Drop shadow */}
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Scene background */}
      <circle cx="60" cy="60" r="60" fill={`url(#${id}-bg)`} />
      <ellipse cx="60" cy="110" rx="26" ry="5" fill="#000" opacity="0.3" />

      {/* ── Saree body ── */}
      {/* Main body drape */}
      <path d="M10 120 Q10 85 60 78 Q110 85 110 120Z" fill={`url(#${id}-sr)`} filter={`url(#${id}-sh)`} />
      {/* Saree pallu over left shoulder */}
      <path d="M10 120 Q10 88 28 80 Q36 76 42 80 Q22 92 16 120Z" fill={`url(#${id}-pl)`} opacity="0.9" />
      {/* Gold zari border — main */}
      <path d="M10 120 Q10 89 60 82 Q110 89 110 120" stroke={`url(#${id}-gd)`} strokeWidth="2.8" fill="none" opacity="0.85" />
      {/* Gold zari border — second line */}
      <path d="M10 120 Q10 93 60 86 Q110 93 110 120" stroke={`url(#${id}-gd)`} strokeWidth="1.2" fill="none" opacity="0.45" />
      {/* Pallu border */}
      <path d="M14 100 Q22 88 34 82" stroke={`url(#${id}-gd)`} strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* ── Neck ── */}
      <rect x="50" y="67" width="20" height="14" rx="8" fill={`url(#${id}-nk)`} />
      {/* Gold necklace */}
      <path d="M46 73 Q60 80 74 73" stroke={`url(#${id}-gd)`} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
      <circle cx="60" cy="78" r="2.2" fill={`url(#${id}-gd)`} />

      {/* ── Head ── */}
      <g className="rh-head-idle" style={{ transformOrigin: '60px 45px' }}>

        {/* Left ear */}
        <ellipse cx="29" cy="50" rx="5.5" ry="7" fill={`url(#${id}-ear)`} />
        <path d="M31 46 Q28 50 31 54" stroke="#703008" strokeWidth="1.1" fill="none" />
        {/* Jhumka earring left */}
        <circle cx="26.5" cy="55" r="4" fill={`url(#${id}-gd)`} filter={`url(#${id}-sh)`} />
        <ellipse cx="26.5" cy="60" rx="3" ry="3.5" fill={`url(#${id}-gd)`} />
        <path d="M24.2 63 L24.8 67 M26.5 64 L26.5 68 M28.8 63 L28.2 67"
          stroke={`url(#${id}-gd)`} strokeWidth="0.9" strokeLinecap="round" />

        {/* Right ear */}
        <ellipse cx="91" cy="50" rx="5.5" ry="7" fill={`url(#${id}-ear)`} />
        <path d="M89 46 Q92 50 89 54" stroke="#703008" strokeWidth="1.1" fill="none" />
        {/* Jhumka earring right */}
        <circle cx="93.5" cy="55" r="4" fill={`url(#${id}-gd)`} filter={`url(#${id}-sh)`} />
        <ellipse cx="93.5" cy="60" rx="3" ry="3.5" fill={`url(#${id}-gd)`} />
        <path d="M91.2 63 L91.8 67 M93.5 64 L93.5 68 M95.8 63 L95.2 67"
          stroke={`url(#${id}-gd)`} strokeWidth="0.9" strokeLinecap="round" />

        {/* Head sphere — 3D shaded */}
        <ellipse cx="60" cy="45" rx="31" ry="33" fill={`url(#${id}-sk)`} filter={`url(#${id}-sh)`} />
        <ellipse cx="60" cy="45" rx="31" ry="33" fill={`url(#${id}-skd)`} />

        {/* ── Hair ── */}
        {/* Sides and top covering */}
        <path d="M29 43 Q29 14 60 12 Q91 14 91 43 Q89 28 74 20 Q60 16 46 20 Q31 28 29 43Z"
          fill={`url(#${id}-hr)`} />
        {/* Side hair flowing down to ears */}
        <path d="M29 43 Q27 54 29 62 Q29 52 33 46Z" fill="#0a0604" />
        <path d="M91 43 Q93 54 91 62 Q91 52 87 46Z" fill="#0a0604" />
        {/* Centre parting line */}
        <path d="M54 13 Q60 11 66 13" stroke="#2a1408" strokeWidth="1.2" fill="none" />
        {/* Hair sheen highlight */}
        <path d="M38 20 Q60 13 80 22 Q60 15 38 20Z" fill="#2e1a08" opacity="0.55" />

        {/* Kondai (hair bun) — on top back */}
        <ellipse cx="60" cy="9" rx="15" ry="10" fill={`url(#${id}-bn)`} filter={`url(#${id}-sh)`} />
        {/* Bun sheen */}
        <ellipse cx="55" cy="6" rx="6" ry="3.5" fill="#2e1808" opacity="0.5" />
        {/* Bun spiral line */}
        <path d="M52 8 Q60 4 68 8 Q64 12 60 13 Q56 12 52 8Z" stroke="#1a0e06" strokeWidth="0.8" fill="none" opacity="0.5" />

        {/* Jasmine flowers (malli poo) */}
        {[
          [48, 7], [53, 4], [60, 2], [67, 4], [72, 7],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="2.8" fill="white" opacity="0.95" />
            <circle cx={x} cy={y} r="1"   fill="#f0e050" />
          </g>
        ))}

        {/* ── Bindi (pottu) ── */}
        <circle cx="60" cy="28" r="3.2" fill="#cc1028" />
        <circle cx="60" cy="28" r="1.6" fill="#ff3858" opacity="0.55" />

        {/* ── Eyebrows — thick, well defined ── */}
        <path d="M37 36 Q43 31 50 33" stroke="#1a0804" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <path d="M70 33 Q77 31 83 36" stroke="#1a0804" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <path d="M37 35.5 Q43 30.5 50 32.5" stroke="#4a2408" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.45" />
        <path d="M70 32.5 Q77 30.5 83 35.5" stroke="#4a2408" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.45" />

        {/* ── Eyes — large, almond-shaped with kohl ── */}
        {/* Left eye shadow socket */}
        <ellipse cx="43" cy="44" rx="11" ry="8.5" fill="#7a3008" opacity="0.18" />
        {/* Left white */}
        <ellipse cx="43" cy="43" rx="9" ry="7" fill={`url(#${id}-ew)`} />
        {/* Left iris */}
        <circle cx="43" cy="43" r="4.8" fill={`url(#${id}-ir)`} />
        {/* Left pupil */}
        <circle cx="43" cy="43" r="2.6" fill="#040202" />
        {/* Left catch-lights */}
        <circle cx="41.2" cy="41.2" r="1.6" fill="white" opacity="0.92" />
        <circle cx="45.2" cy="44.8" r="0.8" fill="white" opacity="0.38" />
        {/* Left kohl — upper lid */}
        <path d="M34 40 Q43 36.5 52 40" stroke="#0c0604" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Kohl wing left side */}
        <path d="M34 40 Q31.5 39.5 30 38" stroke="#0c0604" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Left kohl — lower lid */}
        <path d="M34 46 Q43 49.5 52 46" stroke="#0c0604" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M34 46 Q31.5 47 30 48.5" stroke="#0c0604" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        {/* Left blink */}
        <g className="rh-blink" style={{ transformOrigin: '43px 43px' }}>
          <ellipse cx="43" cy="43" rx="9.5" ry="7" fill="#9a4c18" />
          <path d="M34 43 Q43 37 52 43" fill="#1a0804" />
        </g>

        {/* Right eye shadow socket */}
        <ellipse cx="77" cy="44" rx="11" ry="8.5" fill="#7a3008" opacity="0.18" />
        {/* Right white */}
        <ellipse cx="77" cy="43" rx="9" ry="7" fill={`url(#${id}-ew)`} />
        {/* Right iris */}
        <circle cx="77" cy="43" r="4.8" fill={`url(#${id}-ir)`} />
        {/* Right pupil */}
        <circle cx="77" cy="43" r="2.6" fill="#040202" />
        {/* Right catch-lights */}
        <circle cx="75.2" cy="41.2" r="1.6" fill="white" opacity="0.92" />
        <circle cx="79.2" cy="44.8" r="0.8" fill="white" opacity="0.38" />
        {/* Right kohl — upper lid */}
        <path d="M68 40 Q77 36.5 86 40" stroke="#0c0604" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M86 40 Q88.5 39.5 90 38" stroke="#0c0604" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Right kohl — lower lid */}
        <path d="M68 46 Q77 49.5 86 46" stroke="#0c0604" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M86 46 Q88.5 47 90 48.5" stroke="#0c0604" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        {/* Right blink */}
        <g className="rh-blink" style={{ transformOrigin: '77px 43px' }}>
          <ellipse cx="77" cy="43" rx="9.5" ry="7" fill="#9a4c18" />
          <path d="M68 43 Q77 37 86 43" fill="#1a0804" />
        </g>

        {/* ── Nose — broader, 3D ── */}
        <path d="M60 49 Q57 56 55 60 Q58 63 60 62.5 Q62 63 65 60 Q63 56 60 49Z" fill="#944010" opacity="0.55" />
        <circle cx="60" cy="61" r="5.2" fill="#ae5e22" />
        <ellipse cx="55.5" cy="62.5" rx="3.4" ry="2.4" fill="#843010" />
        <ellipse cx="64.5" cy="62.5" rx="3.4" ry="2.4" fill="#843010" />
        <circle cx="58.5" cy="59" r="1.3" fill="white" opacity="0.2" />
        {/* Nath (nose stud) on left nostril */}
        <circle cx="54.5" cy="61.5" r="1.4" fill={`url(#${id}-gd)`} opacity="0.95" />
        <circle cx="54.5" cy="61.5" r="0.6" fill="white" opacity="0.5" />

        {/* ── Lips — full with colour ── */}
        {/* Philtrum */}
        <path d="M57 65 Q60 67.5 63 65" stroke="#8a2c10" strokeWidth="0.9" fill="none" />
        {/* Upper lip */}
        <path d="M47 68.5 Q53.5 65 60 66.5 Q66.5 65 73 68.5" fill={`url(#${id}-lp)`} />
        {/* Lower lip */}
        <path d="M47 68.5 Q60 77.5 73 68.5 Q66 74.5 60 75.5 Q54 74.5 47 68.5Z" fill={`url(#${id}-lp)`} opacity="0.9" />
        {/* Lip highlight */}
        <path d="M52 71 Q60 74.5 68 71" stroke="#e05878" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
        {/* Teeth */}
        <path d="M52 69 Q60 72 68 69 Q60 70.5 52 69Z" fill="white" opacity="0.65" />

        {/* Cheek blush */}
        <ellipse cx="32" cy="57" rx="10" ry="6" fill="#d86040" opacity="0.1" />
        <ellipse cx="88" cy="57" rx="10" ry="6" fill="#d86040" opacity="0.1" />

        {/* Chin shadow */}
        <ellipse cx="60" cy="75" rx="15" ry="5" fill="#6a2808" opacity="0.18" />

        {/* Global specular on head */}
        <ellipse cx="60" cy="45" rx="31" ry="33" fill={`url(#${id}-sp)`} />
      </g>
    </svg>
  );
}


// ── Avatar button wrapper ───────────────────────────────────────────────────
function AvatarBubble({ ring, glow, emoji, waving, onWaveDone }: {
  ring: string; glow: string; emoji: string; waving: boolean; onWaveDone: () => void
}) {
  return (
    <div className={`rh-float relative w-16 h-16 rounded-full ${waving ? 'rh-heartbeat' : ''}`}
      onAnimationEnd={waving ? onWaveDone : undefined}>
      {/* Pulsing rings */}
      <span className={`rh-pulse  absolute inset-0 rounded-full ring-2 ${ring}`} />
      <span className={`rh-pulse-2 absolute inset-0 rounded-full ring-1 ${ring} opacity-50`} />
      {/* Face */}
      <div className={`absolute inset-0 rounded-full overflow-hidden ring-2 ${ring} shadow-xl ${glow} transition-all duration-500`}>
        <Avatar3D size={64} />
      </div>
      {/* Online dot */}
      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950 z-10" />
      {/* Emoji badge */}
      <span key={emoji} className="rh-pop-in absolute -top-1 -right-1 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm z-10 shadow-lg">
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
  const [waving, setWaving] = useState(false);
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

  // 5s idle → pop-out wave
  const resetIdle = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    setWaving(false);
    if (!open) {
      idleRef.current = setTimeout(() => setWaving(true), IDLE_MS);
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
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-rose-500/50 shrink-0">
                <Avatar3D size={40} />
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
                onClick={() => { setOpen(true); setShowGreet(false); setWaving(false); }}
                className="block w-full mt-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors text-center"
              >
                Ask me anything
              </button>
            </div>
          )}

          {/* Avatar button */}
          <button
            onClick={() => { setOpen(true); setShowGreet(false); setWaving(false); }}
            aria-label="Open Rotehügels Assist"
            className="pointer-events-auto transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <AvatarBubble
              ring={ctx.ring} glow={ctx.glow} emoji={ctx.emoji}
              waving={waving}
              onWaveDone={() => setWaving(false)}
            />
          </button>
        </div>
      )}
    </div>
  );
}
