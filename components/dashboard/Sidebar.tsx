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
  IndianRupee,
  ReceiptText,
  ShoppingBag,
  FileText,
  BadgePercent,
  Landmark,
  TrendingUp,
  Wallet,
  Receipt,
  Building2,
  BookOpen,
  FilePlus,
  ShoppingCart,
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
      { label: 'Employees',    href: '/dashboard/hr/employees', icon: Users },
      { label: 'Add Employee', href: '/dashboard/hr/add',       icon: UserPlus },
      { label: '─ Payroll',    href: '/dashboard/payroll',      icon: Receipt },
      { label: 'Salary Setup', href: '/dashboard/payroll/setup', icon: Receipt },
      { label: 'Run Payroll',  href: '/dashboard/payroll/new',  icon: Receipt },
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
    label: 'Accounts',
    icon: IndianRupee,
    children: [
      { label: 'Overview',      href: '/dashboard/accounts',                    icon: IndianRupee },
      { label: '─ Customers',   href: '/dashboard/accounts/customers',           icon: Building2 },
      { label: 'Add Customer',  href: '/dashboard/accounts/customers/new',       icon: UserPlus },
      { label: '─ Catalog',     href: '/dashboard/accounts/items',               icon: BookOpen },
      { label: 'Add Item',      href: '/dashboard/accounts/items/new',           icon: Package },
      { label: '─ Quotes',      href: '/dashboard/accounts/quotes',              icon: FileText },
      { label: 'New Quote',     href: '/dashboard/accounts/quotes/new',          icon: FilePlus },
      { label: '─ Orders',      href: '/dashboard/accounts/orders',              icon: ReceiptText },
      { label: 'New Order',     href: '/dashboard/accounts/orders/new',          icon: ShoppingBag },
      { label: '─ Purchases',   href: '/dashboard/accounts/purchase-orders',     icon: ShoppingCart },
      { label: 'New PO',        href: '/dashboard/accounts/purchase-orders/new', icon: FilePlus },
      { label: '─ Finance',     href: '/dashboard/accounts/expenses',            icon: ClipboardList },
      { label: 'Stock',         href: '/dashboard/accounts/stock',               icon: Package },
      { label: 'Bank Statement',href: '/dashboard/accounts/bank',                icon: Landmark },
      { label: 'GST Report',    href: '/dashboard/accounts/gst',                 icon: BadgePercent },
      { label: 'P&L Statement', href: '/dashboard/accounts/pl',                  icon: FileText },
    ],
  },
  {
    label: 'Investments',
    href: '/dashboard/investments',
    icon: TrendingUp,
  },
  {
    label: 'Finance',
    href: '/dashboard/finance',
    icon: Wallet,
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
            {item.children.map((child) => {
              // Section divider labels start with "─"
              if (child.label.startsWith('─')) {
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={[
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      pathname.startsWith(child.href)
                        ? 'bg-rose-500/10 text-rose-400 font-medium'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
                    ].join(' ')}
                  >
                    <child.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-semibold tracking-wide uppercase">
                      {child.label.replace('─ ', '')}
                    </span>
                  </Link>
                );
              }
              return (
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
              );
            })}
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
