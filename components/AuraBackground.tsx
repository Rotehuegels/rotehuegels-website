'use client';

export default function AuraBackground() {
  return (
    <>
      <style>{`
        @keyframes aura-drift-1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(70px, -50px) scale(1.12); }
          66%  { transform: translate(-40px, 80px) scale(0.92); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-90px, 70px) scale(1.18); }
          66%  { transform: translate(60px, -60px) scale(0.88); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(50px, 90px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-4 {
          0%   { transform: translate(0px, 0px) scale(1); }
          40%  { transform: translate(-60px, -80px) scale(1.14); }
          80%  { transform: translate(80px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Top-left — large warm rose bloom */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-15%',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.22) 0%, rgba(225,29,72,0.06) 50%, transparent 72%)',
          filter: 'blur(72px)',
          animation: 'aura-drift-1 28s ease-in-out infinite, aura-pulse 14s ease-in-out infinite',
        }} />

        {/* Bottom-right — deep crimson */}
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-15%',
          width: '75vw',
          height: '75vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(190,18,60,0.18) 0%, rgba(190,18,60,0.05) 50%, transparent 72%)',
          filter: 'blur(90px)',
          animation: 'aura-drift-2 34s ease-in-out infinite, aura-pulse 18s ease-in-out infinite',
          animationDelay: '0s, -6s',
        }} />

        {/* Centre — soft mid-rose glow */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.11) 0%, transparent 68%)',
          filter: 'blur(100px)',
          animation: 'aura-drift-3 40s ease-in-out infinite, aura-pulse 20s ease-in-out infinite',
          animationDelay: '-8s, -4s',
        }} />

        {/* Bottom-left — teal counter-accent, very faint */}
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '-5%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 68%)',
          filter: 'blur(80px)',
          animation: 'aura-drift-4 32s ease-in-out infinite',
          animationDelay: '-12s',
        }} />

        {/* Top-right — accent rose dot */}
        <div style={{
          position: 'absolute',
          top: '8%',
          right: '-8%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,113,133,0.10) 0%, transparent 68%)',
          filter: 'blur(70px)',
          animation: 'aura-drift-1 22s ease-in-out infinite reverse, aura-pulse 16s ease-in-out infinite',
          animationDelay: '-5s, -10s',
        }} />
      </div>
    </>
  );
}
