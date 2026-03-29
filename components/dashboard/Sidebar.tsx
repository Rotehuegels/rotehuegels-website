'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Network,
  Package,
  ChevronDown,
  Briefcase,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

interface Props {
  userEmail: string;
}

const NAV = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'HR',
    icon: Users,
    children: [
      { label: 'Employees', href: '/dashboard/hr/employees', icon: Users },
      { label: 'Add Employee', href: '/dashboard/hr/add', icon: UserPlus },
    ],
  },
  {
    label: 'ATS',
    icon: Briefcase,
    children: [
      { label: 'Overview', href: '/dashboard/ats', icon: ClipboardList },
      { label: 'Job Postings', href: '/dashboard/ats/jobs', icon: Briefcase },
      { label: 'Post a Job', href: '/dashboard/ats/jobs/new', icon: UserPlus },
    ],
  },
  {
    label: 'REX Members',
    href: '/dashboard/rex',
    icon: Network,
  },
  {
    label: 'Suppliers',
    href: '/dashboard/suppliers',
    icon: Package,
  },
];

function NavItem({
  item,
  pathname,
}: {
  item: (typeof NAV)[number];
  pathname: string;
}) {
  const [open, setOpen] = useState(
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-4">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === child.href
                    ? 'bg-rose-500/10 text-rose-400 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
                ].join(' ')}
              >
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
    <Link
      href={item.href!}
      className={[
        'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
        pathname === item.href
          ? 'bg-rose-500/10 text-rose-400 font-medium'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
      ].join(' ')}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export default function Sidebar({ userEmail }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col justify-between py-6 px-4">
      {/* Logo */}
      <div>
        <div className="mb-8 px-2">
          <Image src="/logo.png" alt="Rotehügels" width={130} height={36} priority />
          <p className="mt-1.5 text-[10px] text-zinc-600 uppercase tracking-widest">
            Internal Dashboard
          </p>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {NAV.map((item) => (
            <NavItem key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

      {/* User + logout */}
      <div className="border-t border-zinc-800 pt-4">
        <div className="mb-2 px-4 py-2 rounded-xl bg-zinc-900/60">
          <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
          <p className="text-xs text-rose-400 font-medium">Super Admin</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
