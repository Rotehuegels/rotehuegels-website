'use client';

export default function AuraBackground() {
  return (
    <>
      <style>{`
        @keyframes aura-drift-1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(70px, -60px) scale(1.1); }
          66%  { transform: translate(-50px, 80px) scale(0.93); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-90px, 70px) scale(1.14); }
          66%  { transform: translate(60px, -70px) scale(0.89); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(50px, 90px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        /* Colour-shift animations — each orb cycles through hues */
        @keyframes color-rose-purple {
          0%   { background: radial-gradient(circle, rgba(225,29,72,0.35) 0%, rgba(225,29,72,0.12) 42%, transparent 68%); }
          25%  { background: radial-gradient(circle, rgba(168,85,247,0.32) 0%, rgba(168,85,247,0.10) 42%, transparent 68%); }
          50%  { background: radial-gradient(circle, rgba(251,113,133,0.35) 0%, rgba(251,113,133,0.12) 42%, transparent 68%); }
          75%  { background: radial-gradient(circle, rgba(217,70,239,0.28) 0%, rgba(217,70,239,0.09) 42%, transparent 68%); }
          100% { background: radial-gradient(circle, rgba(225,29,72,0.35) 0%, rgba(225,29,72,0.12) 42%, transparent 68%); }
        }
        @keyframes color-crimson-orange {
          0%   { background: radial-gradient(circle, rgba(190,18,60,0.32) 0%, rgba(190,18,60,0.10) 42%, transparent 68%); }
          25%  { background: radial-gradient(circle, rgba(234,88,12,0.28) 0%, rgba(234,88,12,0.09) 42%, transparent 68%); }
          50%  { background: radial-gradient(circle, rgba(239,68,68,0.32) 0%, rgba(239,68,68,0.10) 42%, transparent 68%); }
          75%  { background: radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.07) 42%, transparent 68%); }
          100% { background: radial-gradient(circle, rgba(190,18,60,0.32) 0%, rgba(190,18,60,0.10) 42%, transparent 68%); }
        }
        @keyframes color-pink-teal {
          0%   { background: radial-gradient(circle, rgba(244,63,94,0.28) 0%, transparent 65%); }
          33%  { background: radial-gradient(circle, rgba(20,184,166,0.20) 0%, transparent 65%); }
          66%  { background: radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%); }
          100% { background: radial-gradient(circle, rgba(244,63,94,0.28) 0%, transparent 65%); }
        }
        @keyframes color-base {
          0%   { background: radial-gradient(ellipse at center, rgba(180,18,50,0.22) 0%, rgba(160,10,40,0.10) 40%, transparent 70%); }
          25%  { background: radial-gradient(ellipse at center, rgba(120,30,180,0.18) 0%, rgba(100,20,160,0.08) 40%, transparent 70%); }
          50%  { background: radial-gradient(ellipse at center, rgba(190,20,60,0.22) 0%, rgba(160,10,50,0.10) 40%, transparent 70%); }
          75%  { background: radial-gradient(ellipse at center, rgba(200,50,20,0.16) 0%, rgba(180,30,10,0.07) 40%, transparent 70%); }
          100% { background: radial-gradient(ellipse at center, rgba(180,18,50,0.22) 0%, rgba(160,10,40,0.10) 40%, transparent 70%); }
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Base fill — always covers full viewport, shifts rose → purple → crimson */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '160vw',
          height: '160vh',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'color-base 20s ease-in-out infinite',
        }} />

        {/* Top-left — rose → violet */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-15%',
          width: '90vw',
          height: '90vw',
          borderRadius: '50%',
          filter: 'blur(70px)',
          animation: 'aura-drift-1 28s ease-in-out infinite, color-rose-purple 14s ease-in-out infinite',
          animationDelay: '0s, -2s',
        }} />

        {/* Bottom-right — crimson → orange */}
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-15%',
          width: '90vw',
          height: '90vw',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'aura-drift-2 34s ease-in-out infinite, color-crimson-orange 18s ease-in-out infinite',
          animationDelay: '0s, -6s',
        }} />

        {/* Centre-right — pink → teal → indigo */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: '80vw',
          height: '80vw',
          borderRadius: '50%',
          filter: 'blur(100px)',
          animation: 'aura-drift-3 42s ease-in-out infinite, color-pink-teal 22s ease-in-out infinite',
          animationDelay: '-10s, -8s',
        }} />

        {/* Top-right — mirrors top-left out of phase */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'aura-drift-1 26s ease-in-out infinite reverse, color-rose-purple 16s ease-in-out infinite',
          animationDelay: '-5s, -9s',
        }} />
      </div>
    </>
  );
}
