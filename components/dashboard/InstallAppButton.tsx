'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

// ── Types for the BeforeInstallPrompt event (not in standard TS lib) ─────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

/**
 * PWA Install button. Works across platforms:
 * - Android/Chrome/Edge: Uses native beforeinstallprompt API
 * - iOS Safari: Shows manual instructions (iOS doesn't support the API)
 * - Desktop Chrome/Edge: Uses native prompt
 * - Already installed or unsupported: Hides itself
 */
export default function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    // Check navigator.standalone for iOS
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // Check if user previously dismissed
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) { setDismissed(true); return; }
      localStorage.removeItem('pwa-install-dismissed');
    }

    // Listen for the install prompt (Chrome, Edge, Samsung, Opera)
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect when app is installed
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Don't show if installed or dismissed
  if (isInstalled || dismissed) return null;
  // Don't show if not iOS and no prompt available (unsupported browser)
  if (!isIOS && !deferredPrompt) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  // ── Compact mode (sidebar/nav) ──────────────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={handleInstall}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        <Download className="h-4 w-4 shrink-0" />
        Install App
      </button>
    );
  }

  // ── Full mode (banner) ──────────────────────────────────────────────────
  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
        <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-emerald-400">Install App</p>
          <p className="text-[10px] text-zinc-500 truncate">Use as a native app on your device</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors"
        >
          Install
        </button>
        <button onClick={handleDismiss} className="shrink-0 p-1 text-zinc-600 hover:text-zinc-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* iOS Safari instructions modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)} />
          <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <button onClick={() => setShowIOSGuide(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="text-center space-y-4">
              <Smartphone className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Install on iOS</h3>
              <div className="text-sm text-zinc-400 space-y-3 text-left">
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">1</span>
                  <p>Tap the <strong className="text-white">Share</strong> button <span className="inline-block text-base align-middle">&#x2191;&#xFE0E;</span> at the bottom of Safari</p>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">2</span>
                  <p>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></p>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">3</span>
                  <p>Tap <strong className="text-white">Add</strong> to confirm</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-500/20 py-3 text-sm font-medium text-emerald-400"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
