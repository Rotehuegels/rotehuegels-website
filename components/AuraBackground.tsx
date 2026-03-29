'use client';

export default function AuraBackground() {
  return (
    <>
      <style>{`
        @keyframes aura-drift-1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(80px, -60px) scale(1.1); }
          66%  { transform: translate(-50px, 90px) scale(0.93); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-100px, 80px) scale(1.15); }
          66%  { transform: translate(70px, -70px) scale(0.88); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(60px, 100px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Top-left — large primary bloom */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: '110vw',
          height: '110vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.28) 0%, rgba(225,29,72,0.10) 40%, transparent 68%)',
          filter: 'blur(80px)',
          animation: 'aura-drift-1 30s ease-in-out infinite, aura-pulse 15s ease-in-out infinite',
        }} />

        {/* Bottom-right — crimson anchor */}
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-20%',
          width: '110vw',
          height: '110vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(190,18,60,0.24) 0%, rgba(190,18,60,0.08) 40%, transparent 68%)',
          filter: 'blur(90px)',
          animation: 'aura-drift-2 36s ease-in-out infinite, aura-pulse 18s ease-in-out infinite',
          animationDelay: '0s, -7s',
        }} />

        {/* Centre — fills the middle void */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: '80vw',
          height: '80vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.16) 0%, transparent 65%)',
          filter: 'blur(100px)',
          animation: 'aura-drift-3 42s ease-in-out infinite, aura-pulse 22s ease-in-out infinite',
          animationDelay: '-10s, -5s',
        }} />

        {/* Top-right — secondary rose */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-15%',
          width: '80vw',
          height: '80vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,113,133,0.18) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'aura-drift-1 26s ease-in-out infinite reverse, aura-pulse 17s ease-in-out infinite',
          animationDelay: '-6s, -12s',
        }} />

        {/* Bottom-left — teal whisper */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'aura-drift-2 38s ease-in-out infinite reverse',
          animationDelay: '-14s',
        }} />
      </div>
    </>
  );
}
