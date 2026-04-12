'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import {
  LayoutDashboard,
  Users, UserPlus, UserCheck,
  Briefcase, FilePlus, ClipboardList,
  Receipt, Settings2,
  ShoppingBag, Building2, BookOpen, FileText, ReceiptText,
  Package, ShoppingCart, Truck,
  Wallet, Landmark, BadgePercent, TrendingUp, BarChart2,
  Network,
  Shield, BarChart3, Globe, Eye, Mail, History,
  Radar, AlertTriangle,
  FileCheck, FolderKanban, FolderPlus, CalendarDays, Factory, FlaskConical,
  ChevronDown,
} from 'lucide-react';
import LogoutButton from './LogoutButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type NavLink    = { type?: 'link'; label: string; href: string; icon: React.ElementType };
type NavSection = { type: 'section'; label: string };
type NavChild   = NavLink | NavSection;

type NavGroup = {
  label: string;
  icon: React.ElementType;
  children: NavChild[];
};
type NavTop = { label: string; href: string; icon: React.ElementType };
type NavItem = NavTop | NavGroup;

// ── Navigation tree ────────────────────────────────────────────────────────────
const NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },

  {
    label: 'Projects', icon: FolderKanban,
    children: [
      { label: 'All Projects',  href: '/dashboard/projects',     icon: FolderKanban },
      { label: 'New Project',   href: '/dashboard/projects/new', icon: FolderPlus },
    ],
  },

  {
    label: 'Operations', icon: Factory,
    children: [
      { label: 'Contracts',       href: '/dashboard/operations',     icon: Factory },
      { label: 'Lab Parameters',  href: '/dashboard/operations/lab', icon: FlaskConical },
    ],
  },

  {
    label: 'People', icon: Users,
    children: [
      { label: 'Employees',    href: '/dashboard/hr/employees',  icon: Users },
      { label: 'Add Employee', href: '/dashboard/hr/add',        icon: UserPlus },
      { type: 'section', label: 'Leave' },
      { label: 'Leave Management', href: '/dashboard/hr/leave', icon: CalendarDays },
      { type: 'section', label: 'Payroll' },
      { label: 'History',      href: '/dashboard/payroll',       icon: ClipboardList },
      { label: 'Salary Setup', href: '/dashboard/payroll/setup', icon: Settings2 },
      { label: 'Run Payroll',  href: '/dashboard/payroll/new',   icon: Receipt },
      { type: 'section', label: 'Recruitment' },
      { label: 'Job Postings',  href: '/dashboard/ats/jobs',          icon: Briefcase },
      { label: 'Applications', href: '/dashboard/ats/applications', icon: UserCheck },
      { label: 'Post a Job',   href: '/dashboard/ats/jobs/new',    icon: FilePlus },
    ],
  },

  {
    label: 'Sales', icon: ShoppingBag,
    children: [
      { label: 'Customers', href: '/dashboard/accounts/customers',  icon: Building2 },
      { label: 'Catalog',   href: '/dashboard/accounts/items',      icon: BookOpen },
      { label: 'Quotes',    href: '/dashboard/accounts/quotes',     icon: FileText },
      { label: 'Orders',    href: '/dashboard/accounts/orders',     icon: ReceiptText },
      { type: 'section', label: 'Intelligence' },
      { label: 'Market Intelligence', href: '/dashboard/intelligence', icon: Radar },
    ],
  },

  {
    label: 'Procurement', icon: Package,
    children: [
      { label: 'Purchase Orders',  href: '/dashboard/accounts/purchase-orders', icon: ShoppingCart },
      { label: 'Suppliers',        href: '/dashboard/accounts/suppliers',       icon: Truck },
      { label: 'Stock & Inventory',href: '/dashboard/accounts/stock',           icon: Package },
    ],
  },

  {
    label: 'Finance', icon: Wallet,
    children: [
      { label: 'Expenses',       href: '/dashboard/accounts/expenses', icon: Receipt },
      { label: 'Bank Statement', href: '/dashboard/accounts/bank',     icon: Landmark },
      { label: 'GST Report',     href: '/dashboard/accounts/gst',          icon: BadgePercent },
      { label: 'GST Filing',     href: '/dashboard/accounts/gst/filing', icon: BadgePercent },
      { label: 'P&L Statement',  href: '/dashboard/accounts/pl',       icon: TrendingUp },
      { label: 'Investments',        href: '/dashboard/investments',          icon: BarChart2 },
      { label: 'Stock Intelligence', href: '/dashboard/stock-intelligence', icon: AlertTriangle },
    ],
  },

  {
    label: 'IT', icon: Shield,
    children: [
      { label: 'Mail',             href: '/dashboard/mail',              icon: Mail },
      { label: 'Chat Analytics',   href: '/dashboard/analytics',         icon: BarChart3 },
      { label: 'Visitor Insights', href: '/dashboard/analytics#orgs',    icon: Eye },
      { label: 'Security Log',     href: '/dashboard/analytics#security', icon: Shield },
      { label: 'Page Views',       href: '/dashboard/analytics#traffic',  icon: Globe },
      { type: 'section', label: 'Audit' },
      { label: 'Audit Trail',     href: '/dashboard/audit',              icon: History },
    ],
  },

  {
    label: 'Quality', icon: FileCheck,
    children: [
      { label: 'Documents', href: '/dashboard/documents', icon: FileCheck },
    ],
  },

  {
    label: 'Network', icon: Network,
    children: [
      { label: 'REX Members',            href: '/dashboard/rex',                    icon: Network },
      { label: 'Supplier Registrations', href: '/dashboard/suppliers',              icon: Building2 },
    ],
  },

  { label: 'Settings', href: '/dashboard/settings', icon: Settings2 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}
function linkChildren(children: NavChild[]): NavLink[] {
  return children.filter((c): c is NavLink => c.type !== 'section');
}

// ── NavGroup component ────────────────────────────────────────────────────────
function GroupItem({ item, pathname }: { item: NavGroup; pathname: string }) {
  const links = linkChildren(item.children);
  const [open, setOpen] = useState(links.some(c => pathname.startsWith(c.href)));

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-3">
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-800 pl-4">
          {item.children.map((child, i) => {
            if (child.type === 'section') {
              return (
                <p key={i} className="mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  {child.label}
                </p>
              );
            }
            const active = pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
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

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col justify-between py-6 px-4">
      <div>
        <div className="mb-6 px-2">
          <Image src="/logo.png" alt="Rotehügels" width={130} height={36} priority />
          <p className="mt-1.5 text-[10px] text-zinc-600 uppercase tracking-widest">
            Internal Dashboard
          </p>
        </div>

        {/* Global search */}
        <div className="mb-4 px-1">
          <GlobalSearch />
        </div>

        <nav className="space-y-1">
          {NAV.map(item => {
            if (isGroup(item)) {
              return <GroupItem key={item.label} item={item} pathname={pathname} />;
            }
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-rose-500/10 text-rose-400 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
                ].join(' ')}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

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
