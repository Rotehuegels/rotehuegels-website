'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, ArrowLeft, Menu, Settings as SettingsIcon } from 'lucide-react';

export const MOBILE_MENU_OPEN_EVENT = 'rh:open-mobile-menu';

export default function MobileBottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const onHome = () => router.push('/d');
  const onBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/d');
  };
  const onMenu = () => window.dispatchEvent(new Event(MOBILE_MENU_OPEN_EVENT));

  const isHome     = pathname === '/d' || pathname === '/dashboard';
  const isSettings = pathname.startsWith('/d/settings') || pathname.startsWith('/dashboard/settings');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black/85 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4 h-14">
        <BarBtn icon={Home}       label="Home"     onClick={onHome} active={isHome} />
        <BarBtn icon={ArrowLeft}  label="Back"     onClick={onBack} />
        <BarBtn icon={Menu}       label="Menu"     onClick={onMenu} />
        <BarLink icon={SettingsIcon} label="Settings" href="/d/settings" active={isSettings} />
      </div>
    </nav>
  );
}

function BarBtn({
  icon: Icon, label, onClick, active = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-zinc-800/80 ${
        active ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function BarLink({
  icon: Icon, label, href, active = false,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-zinc-800/80 ${
        active ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
