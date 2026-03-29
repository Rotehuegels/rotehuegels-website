'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, LayoutDashboard, Users, UserPlus, Network, Package, Briefcase, ClipboardList, LogOut } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'HR', icon: Users,
    children: [
      { label: 'Employees', href: '/dashboard/hr/employees', icon: Users },
      { label: 'Add Employee', href: '/dashboard/hr/add', icon: UserPlus },
    ],
  },
  {
    label: 'ATS', icon: Briefcase,
    children: [
      { label: 'Overview', href: '/dashboard/ats', icon: ClipboardList },
      { label: 'Job Postings', href: '/dashboard/ats/jobs', icon: Briefcase },
      { label: 'Post a Job', href: '/dashboard/ats/jobs/new', icon: UserPlus },
    ],
  },
  { label: 'REX Members', href: '/dashboard/rex', icon: Network },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: Package },
];

export default function MobileNav({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleLogout() {
    await supabaseBrowser().auth.signOut();
    router.replace('/login');
  }

  return (
    <>
      {/* Top bar — mobile only */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/dashboard">
          <Image src="/logo.png" alt="Rotehügels" width={110} height={32} priority />
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors">
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
              <Image src="/logo.png" alt="Rotehügels" width={110} height={32} />
              <button onClick={() => setOpen(false)} aria-label="Close menu"
                className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {NAV.map(item => {
                if (item.children) {
                  const isExpanded = expanded === item.label ||
                    item.children.some(c => pathname.startsWith(c.href));
                  return (
                    <div key={item.label}>
                      <button onClick={() => setExpanded(isExpanded ? null : item.label)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors">
                        <span className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-4">
                          {item.children.map(child => (
                            <Link key={child.href} href={child.href}
                              className={['flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                pathname === child.href
                                  ? 'bg-rose-500/10 text-rose-400 font-medium'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
                              ].join(' ')}>
                              <child.icon className="h-3.5 w-3.5 shrink-0" />
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link key={item.href} href={item.href!}
                    className={['flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
                      pathname === item.href
                        ? 'bg-rose-500/10 text-rose-400 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
                    ].join(' ')}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-zinc-800 px-3 py-4 space-y-2">
              <div className="px-4 py-2 rounded-xl bg-zinc-900/60">
                <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                <p className="text-xs text-rose-400 font-medium">Super Admin</p>
              </div>
              <button onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors">
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
