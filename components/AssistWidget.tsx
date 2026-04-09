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

// ── 3D Avatar SVG with radial-gradient shading ─────────────────────────────
function Avatar3D({ size = 56 }: { size?: number }) {
  const id = 'rha'; // short prefix to avoid conflicts
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} fill="none" aria-hidden>
      <defs>
        {/* Scene BG */}
        <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1e2a3a" />
          <stop offset="100%" stopColor="#0d1117" />
        </radialGradient>
        {/* Skin — main sphere shading (light from top-left) */}
        <radialGradient id={`${id}-skin`} cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#f5cda0" />
          <stop offset="45%"  stopColor="#d4915c" />
          <stop offset="100%" stopColor="#a0582a" />
        </radialGradient>
        {/* Skin dark side */}
        <radialGradient id={`${id}-skin-dark`} cx="75%" cy="70%" r="50%">
          <stop offset="0%" stopColor="#7a3a10" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7a3a10" stopOpacity="0" />
        </radialGradient>
        {/* Hair gradient */}
        <radialGradient id={`${id}-hair`} cx="40%" cy="25%" r="70%">
          <stop offset="0%"   stopColor="#4a2c10" />
          <stop offset="60%"  stopColor="#1e0e05" />
          <stop offset="100%" stopColor="#0d0603" />
        </radialGradient>
        {/* Eye iris */}
        <radialGradient id={`${id}-iris`} cx="35%" cy="35%" r="70%">
          <stop offset="0%"   stopColor="#6b4226" />
          <stop offset="50%"  stopColor="#3b1e0a" />
          <stop offset="100%" stopColor="#0d0603" />
        </radialGradient>
        {/* Shirt */}
        <linearGradient id={`${id}-shirt`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        {/* Collar */}
        <linearGradient id={`${id}-collar`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        {/* Neck */}
        <linearGradient id={`${id}-neck`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="#c07840" />
          <stop offset="40%" stopColor="#dfa060" />
          <stop offset="100%" stopColor="#9a5820" />
        </linearGradient>
        {/* Ear */}
        <radialGradient id={`${id}-ear`} cx="60%" cy="40%" r="70%">
          <stop offset="0%"   stopColor="#dfa060" />
          <stop offset="100%" stopColor="#a05828" />
        </radialGradient>
        {/* Drop shadow */}
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
        {/* Specular highlight */}
        <radialGradient id={`${id}-spec`} cx="32%" cy="28%" r="28%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Eyeball */}
        <radialGradient id={`${id}-eye-white`} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d0ccc8" />
        </radialGradient>
      </defs>

      {/* Scene background circle */}
      <circle cx="60" cy="60" r="60" fill={`url(#${id}-bg)`} />

      {/* Ambient ground shadow */}
      <ellipse cx="60" cy="108" rx="28" ry="6" fill="#000" opacity="0.35" />

      {/* ── Body ── */}
      {/* Jacket */}
      <path d="M14 120 Q14 86 60 82 Q106 86 106 120Z" fill={`url(#${id}-shirt)`} filter={`url(#${id}-shadow)`} />
      {/* Jacket lapel shadow */}
      <path d="M40 82 Q48 90 60 92 Q72 90 80 82 Q72 80 60 80 Q48 80 40 82Z" fill="#1e3a8a" opacity="0.6" />
      {/* White shirt collar */}
      <path d="M46 82 L60 96 L74 82 Q68 79 60 79 Q52 79 46 82Z" fill={`url(#${id}-collar)`} />
      {/* Collar shadow fold */}
      <path d="M60 79 L55 90 L60 96 L65 90Z" fill="#94a3b8" opacity="0.4" />

      {/* ── Neck ── */}
      <rect x="51" y="68" width="18" height="16" rx="7" fill={`url(#${id}-neck)`} />

      {/* ── Head (3D sphere illusion) ── */}
      <g className="rh-head-idle" style={{ transformOrigin: '60px 46px' }}>
        {/* Ear left */}
        <ellipse cx="30" cy="50" rx="5.5" ry="7" fill={`url(#${id}-ear)`} />
        <path d="M32 46 Q29 50 32 54" stroke="#8a4820" strokeWidth="1.2" fill="none" />

        {/* Ear right */}
        <ellipse cx="90" cy="50" rx="5.5" ry="7" fill={`url(#${id}-ear)`} />
        <path d="M88 46 Q91 50 88 54" stroke="#8a4820" strokeWidth="1.2" fill="none" />

        {/* Head sphere */}
        <ellipse cx="60" cy="46" rx="30" ry="32" fill={`url(#${id}-skin)`} filter={`url(#${id}-shadow)`} />
        {/* Dark shading on far side */}
        <ellipse cx="60" cy="46" rx="30" ry="32" fill={`url(#${id}-skin-dark)`} />

        {/* ── Hair ── */}
        {/* Main hair cap */}
        <path d="M30 44 Q30 16 60 14 Q90 16 90 44 Q88 30 72 24 Q60 20 48 24 Q32 30 30 44Z"
          fill={`url(#${id}-hair)`} />
        {/* Sideburn left */}
        <path d="M30 44 Q28 52 30 58 Q30 50 33 46Z" fill="#1e0e05" />
        {/* Sideburn right */}
        <path d="M90 44 Q92 52 90 58 Q90 50 87 46Z" fill="#1e0e05" />
        {/* Hair highlight */}
        <path d="M40 22 Q60 16 78 24 Q60 18 40 22Z" fill="#6b4020" opacity="0.5" />

        {/* ── Eyebrows (3D arched) ── */}
        <path d="M40 36 Q46 32 52 34" stroke="#2c1208" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <path d="M68 34 Q74 32 80 36" stroke="#2c1208" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        {/* Brow highlight */}
        <path d="M40 35 Q46 31 52 33" stroke="#5a3010" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M68 33 Q74 31 80 35" stroke="#5a3010" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />

        {/* ── Eyes ── */}
        {/* Left eye socket shadow */}
        <ellipse cx="46" cy="46" rx="9" ry="7" fill="#8a4818" opacity="0.2" />
        {/* Left eyeball */}
        <ellipse cx="46" cy="45" rx="7.5" ry="6.5" fill={`url(#${id}-eye-white)`} />
        {/* Left iris */}
        <circle cx="46" cy="45" r="4.2" fill={`url(#${id}-iris)`} />
        {/* Left pupil */}
        <circle cx="46" cy="45" r="2.2" fill="#050302" />
        {/* Left eye shine (main) */}
        <circle cx="44.2" cy="43.2" r="1.4" fill="white" opacity="0.9" />
        {/* Left eye shine (secondary) */}
        <circle cx="47.8" cy="46.5" r="0.7" fill="white" opacity="0.4" />
        {/* Left eyelid crease */}
        <path d="M38.5 42 Q46 39 53.5 42" stroke="#c07040" strokeWidth="0.8" fill="none" opacity="0.6" />
        {/* Left lower lid */}
        <path d="M38.5 48 Q46 51 53.5 48" stroke="#c07040" strokeWidth="0.6" fill="none" opacity="0.4" />
        {/* Blink overlay */}
        <g className="rh-blink" style={{ transformOrigin: '46px 45px' }}>
          <ellipse cx="46" cy="45" rx="8" ry="6.5" fill="#c07040" />
          <path d="M38 45 Q46 40 54 45" fill="#2c1208" />
        </g>

        {/* Right eye socket shadow */}
        <ellipse cx="74" cy="46" rx="9" ry="7" fill="#8a4818" opacity="0.2" />
        {/* Right eyeball */}
        <ellipse cx="74" cy="45" rx="7.5" ry="6.5" fill={`url(#${id}-eye-white)`} />
        {/* Right iris */}
        <circle cx="74" cy="45" r="4.2" fill={`url(#${id}-iris)`} />
        {/* Right pupil */}
        <circle cx="74" cy="45" r="2.2" fill="#050302" />
        {/* Right eye shine */}
        <circle cx="72.2" cy="43.2" r="1.4" fill="white" opacity="0.9" />
        <circle cx="75.8" cy="46.5" r="0.7" fill="white" opacity="0.4" />
        {/* Right eyelid crease */}
        <path d="M66.5 42 Q74 39 81.5 42" stroke="#c07040" strokeWidth="0.8" fill="none" opacity="0.6" />
        <path d="M66.5 48 Q74 51 81.5 48" stroke="#c07040" strokeWidth="0.6" fill="none" opacity="0.4" />
        {/* Blink overlay */}
        <g className="rh-blink" style={{ transformOrigin: '74px 45px' }}>
          <ellipse cx="74" cy="45" rx="8" ry="6.5" fill="#c07040" />
          <path d="M66 45 Q74 40 82 45" fill="#2c1208" />
        </g>

        {/* ── Nose (3D with shadow) ── */}
        {/* Nose bridge */}
        <path d="M60 50 Q57 57 55 61 Q58 64 60 63.5 Q62 64 65 61 Q63 57 60 50Z" fill="#bf7238" opacity="0.7" />
        {/* Nose tip sphere */}
        <circle cx="60" cy="62" r="4.5" fill="#c87840" />
        <circle cx="60" cy="62" r="4.5" fill="#8a4818" opacity="0.3" />
        {/* Nostril left */}
        <ellipse cx="56" cy="63.5" rx="2.8" ry="2" fill="#8a3a10" />
        {/* Nostril right */}
        <ellipse cx="64" cy="63.5" rx="2.8" ry="2" fill="#8a3a10" />
        {/* Nose highlight */}
        <circle cx="58.5" cy="60" r="1.2" fill="white" opacity="0.25" />

        {/* ── Mouth ── */}
        {/* Philtrum */}
        <path d="M57 66 Q60 68.5 63 66" stroke="#b06030" strokeWidth="0.8" fill="none" />
        {/* Upper lip */}
        <path d="M48 69 Q54 66 60 68 Q66 66 72 69" fill="#b05830" />
        <path d="M48 69 Q54 66.5 60 68.5 Q66 66.5 72 69" stroke="#8a3818" strokeWidth="0.5" fill="none" />
        {/* Smile curve */}
        <path d="M48 69 Q60 78 72 69 Q66 75 60 76 Q54 75 48 69Z" fill="#c06840" />
        {/* Lower lip highlight */}
        <path d="M52 73 Q60 76.5 68 73" stroke="#e09070" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
        {/* Teeth hint */}
        <path d="M52 69.5 Q60 72 68 69.5 Q60 70.5 52 69.5Z" fill="white" opacity="0.7" />

        {/* ── Cheek blush (subtle) ── */}
        <ellipse cx="36" cy="60" rx="9" ry="6" fill="#e87050" opacity="0.1" />
        <ellipse cx="84" cy="60" rx="9" ry="6" fill="#e87050" opacity="0.1" />

        {/* Chin shadow */}
        <ellipse cx="60" cy="74" rx="14" ry="5" fill="#8a3810" opacity="0.2" />

        {/* ── Global specular highlight on head ── */}
        <ellipse cx="60" cy="46" rx="30" ry="32" fill={`url(#${id}-spec)`} />
      </g>
    </svg>
  );
}

// ── Avatar button wrapper ───────────────────────────────────────────────────
function AvatarBubble({ ring, glow, emoji }: { ring: string; glow: string; emoji: string }) {
  return (
    <div className="rh-float relative w-16 h-16">
      {/* Pulsing rings */}
      <span className={`rh-pulse  absolute inset-0 rounded-full ring-2 ${ring}`} />
      <span className={`rh-pulse-2 absolute inset-0 rounded-full ring-1 ${ring} opacity-50`} />
      {/* Face circle */}
      <div className={`w-16 h-16 rounded-full overflow-hidden ring-2 ${ring} shadow-xl ${glow} transition-all duration-500`}>
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
