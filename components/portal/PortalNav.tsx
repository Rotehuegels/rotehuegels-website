'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Milestone, CreditCard, FileText, Package,
  Activity, GitPullRequest, LogOut, Menu, X, ChevronDown,
  Factory, BarChart3, TrendingUp, FlaskConical,
} from 'lucide-react';

type NavLink = { label: string; href: string; icon: React.ElementType };

type NavSection = { type: 'section'; label: string };
type NavItem = NavLink | NavSection;

function getNav(projectId: string, hasOperations: boolean): NavItem[] {
  const base = `/portal/${projectId}`;
  const items: NavItem[] = [
    { label: 'Overview',         href: base,                icon: LayoutDashboard },
    { label: 'Milestones',       href: `${base}/milestones`, icon: Milestone },
    { label: 'Payments',         href: `${base}/payments`,   icon: CreditCard },
    { label: 'Deliveries',       href: `${base}/deliveries`,  icon: Package },
    { label: 'Change Requests',  href: `${base}/changes`,    icon: GitPullRequest },
    { label: 'Documents',        href: `${base}/documents`,  icon: FileText },
    { label: 'Activity',         href: `${base}/activity`,   icon: Activity },
  ];

  if (hasOperations) {
    items.push(
      { type: 'section', label: 'Operations' },
      { label: 'Plant Dashboard',  href: `${base}/operations`,             icon: Factory },
      { label: 'Production Log',   href: `${base}/operations/production`,  icon: BarChart3 },
      { label: 'ROI Tracker',      href: `${base}/operations/roi`,         icon: TrendingUp },
      { label: 'LabREX',           href: `${base}/operations/lab`,         icon: FlaskConical },
    );
  }

  return items;
}

function NavLinks({ nav, pathname, onClick }: { nav: NavItem[]; pathname: string; onClick?: () => void }) {
  const firstLink = nav.find((n): n is NavLink => !('type' in n));
  return (
    <>
      {nav.map((item, i) => {
        if ('type' in item && item.type === 'section') {
          return (
            <p key={`section-${i}`} className="mt-4 mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {item.label}
            </p>
          );
        }
        const link = item as NavLink;
        const active = link.href === pathname || (firstLink && link.href !== firstLink.href && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={[
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
              active
                ? 'bg-rose-500/10 text-rose-400 font-medium'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
            ].join(' ')}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function UserFooter({ userEmail, displayName }: { userEmail: string; displayName: string | null }) {
  return (
    <div className="border-t border-zinc-800 pt-4">
      <div className="mb-2 px-4 py-2 rounded-xl bg-zinc-900/60">
        {displayName && <p className="text-xs text-white font-medium truncate">{displayName}</p>}
        <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
        <p className="text-xs text-rose-400 font-medium">Client Portal</p>
      </div>
      <a
        href="/api/auth/signout"
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </a>
    </div>
  );
}

// Desktop sidebar variant
function DesktopNav({ userEmail, displayName, hasOperations }: { userEmail: string; displayName: string | null; hasOperations: boolean }) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId as string | undefined;

  if (!projectId) return null;
  const nav = getNav(projectId, hasOperations);

  return (
    <aside className="flex h-full flex-col justify-between py-6 px-4">
      <div>
        <div className="mb-6 px-2">
          <Image src="/logo.png" alt="Rotehügels" width={130} height={36} priority />
          <p className="mt-1.5 text-[10px] text-zinc-600 uppercase tracking-widest">
            Client Portal
          </p>
        </div>
        <nav className="space-y-1">
          <NavLinks nav={nav} pathname={pathname} />
        </nav>
      </div>
      <UserFooter userEmail={userEmail} displayName={displayName} />
    </aside>
  );
}

// Mobile nav variant
function MobileNav({ userEmail, displayName, hasOperations }: { userEmail: string; displayName: string | null; hasOperations: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.projectId as string | undefined;

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!projectId) return null;
  const nav = getNav(projectId, hasOperations);

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/portal">
          <Image src="/logo.png" alt="Rotehügels" width={110} height={32} priority />
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors">
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
              <Image src="/logo.png" alt="Rotehügels" width={110} height={32} />
              <button onClick={() => setOpen(false)} aria-label="Close menu"
                className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <NavLinks nav={nav} pathname={pathname} onClick={() => setOpen(false)} />
            </nav>
            <div className="px-3 py-4">
              <UserFooter userEmail={userEmail} displayName={displayName} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PortalNav({ userEmail, displayName, mode, hasOperations = false }: {
  userEmail: string;
  displayName: string | null;
  mode: 'desktop' | 'mobile';
  hasOperations?: boolean;
}) {
  if (mode === 'desktop') return <DesktopNav userEmail={userEmail} displayName={displayName} hasOperations={hasOperations} />;
  return <MobileNav userEmail={userEmail} displayName={displayName} hasOperations={hasOperations} />;
}
