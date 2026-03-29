'use client';

export default function AuraBackground() {
  return (
    <>
      <style>{`
        @keyframes aura-drift-1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(60px, -50px) scale(1.08); }
          66%  { transform: translate(-40px, 70px) scale(0.94); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(-80px, 60px) scale(1.12); }
          66%  { transform: translate(50px, -60px) scale(0.90); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-drift-3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          50%  { transform: translate(40px, 80px) scale(1.06); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
      `}</style>

      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Base fill — giant central orb that covers the entire viewport always */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '160vw',
          height: '160vh',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(180,18,50,0.20) 0%, rgba(160,10,40,0.10) 40%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aura-pulse 18s ease-in-out infinite',
        }} />

        {/* Top-left accent */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-15%',
          width: '90vw',
          height: '90vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.30) 0%, rgba(225,29,72,0.10) 45%, transparent 68%)',
          filter: 'blur(70px)',
          animation: 'aura-drift-1 28s ease-in-out infinite, aura-pulse 14s ease-in-out infinite',
          animationDelay: '0s, -3s',
        }} />

        {/* Bottom-right accent */}
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-15%',
          width: '90vw',
          height: '90vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(190,18,60,0.28) 0%, rgba(190,18,60,0.09) 45%, transparent 68%)',
          filter: 'blur(80px)',
          animation: 'aura-drift-2 34s ease-in-out infinite, aura-pulse 17s ease-in-out infinite',
          animationDelay: '0s, -8s',
        }} />

        {/* Top-right soft pink */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,113,133,0.18) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'aura-drift-1 24s ease-in-out infinite reverse, aura-pulse 16s ease-in-out infinite',
          animationDelay: '-5s, -11s',
        }} />

        {/* Bottom-left teal whisper */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '65vw',
          height: '65vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 65%)',
          filter: 'blur(90px)',
          animation: 'aura-drift-3 40s ease-in-out infinite reverse',
          animationDelay: '-15s',
        }} />
      </div>
    </>
  );
}
