'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import InstallAppButton from './InstallAppButton';
import {
  Menu, X, ChevronDown, LogOut,
  LayoutDashboard,
  Users, UserPlus, UserCheck,
  Briefcase, FilePlus, ClipboardList,
  Receipt, Settings2, Scale,
  ShoppingBag, Building2, BookOpen, FileText, ReceiptText,
  Package, ShoppingCart, Truck,
  Wallet, Landmark, BadgePercent, TrendingUp, BarChart2,
  Network, FolderKanban, FolderPlus, CalendarDays, Factory, FlaskConical,
  Shield, BarChart3, Globe, Eye, Mail, History,
  Radar, AlertTriangle, FileCheck,
  BookOpenCheck, HandCoins, CreditCard,
} from 'lucide-react';

// ── Same nav tree as Sidebar (kept in sync) ──────────────────────────────────
type NavLink    = { type?: 'link'; label: string; href: string; icon: React.ElementType };
type NavSection = { type: 'section'; label: string };
type NavChild   = NavLink | NavSection;
type NavGroup   = { label: string; icon: React.ElementType; children: NavChild[] };
type NavTop     = { label: string; href: string; icon: React.ElementType };
type NavItem    = NavTop | NavGroup;

const NAV: NavItem[] = [
  { label: 'Overview', href: '/d', icon: LayoutDashboard },

  {
    label: 'Projects', icon: FolderKanban,
    children: [
      { label: 'All Projects',  href: '/d/projects',     icon: FolderKanban },
      { label: 'New Project',   href: '/d/projects/new', icon: FolderPlus },
    ],
  },

  {
    label: 'Operations', icon: Factory,
    children: [
      { label: 'Contracts',      href: '/d/operations',     icon: Factory },
      { label: 'Lab Parameters', href: '/d/operations/lab', icon: FlaskConical },
    ],
  },

  {
    label: 'People', icon: Users,
    children: [
      { label: 'Employees',    href: '/d/employees',     icon: Users },
      { label: 'Add Employee', href: '/d/employees/add', icon: UserPlus },
      { type: 'section', label: 'Leave' },
      { label: 'Leave Management', href: '/d/leave', icon: CalendarDays },
      { type: 'section', label: 'Payroll' },
      { label: 'History',      href: '/d/payroll',       icon: ClipboardList },
      { label: 'Salary Setup', href: '/d/payroll/setup', icon: Settings2 },
      { label: 'Run Payroll',  href: '/d/payroll/new',   icon: Receipt },
      { type: 'section', label: 'Recruitment' },
      { label: 'Job Postings',  href: '/d/jobs',          icon: Briefcase },
      { label: 'Applications', href: '/d/applications',  icon: UserCheck },
      { label: 'Post a Job',   href: '/d/jobs/new',      icon: FilePlus },
    ],
  },

  {
    label: 'Sales', icon: ShoppingBag,
    children: [
      { label: 'Customers',       href: '/d/customers',                icon: Building2 },
      { label: 'Registrations',   href: '/d/customers/registrations',  icon: UserCheck },
      { label: 'Leads',           href: '/d/customers/leads',          icon: Users },
      { label: 'Trading Partners', href: '/d/trading',                 icon: Scale },
      { label: 'Catalog',         href: '/d/catalog',                  icon: BookOpen },
      { label: 'Quotes',          href: '/d/quotes',                   icon: FileText },
      { label: 'Orders',          href: '/d/orders',                   icon: ReceiptText },
      { label: 'Recurring Orders', href: '/d/recurring-orders',       icon: ReceiptText },
      { type: 'section', label: 'Intelligence' },
      { label: 'Market Intelligence', href: '/d/intelligence',         icon: Radar },
    ],
  },

  {
    label: 'Procurement', icon: Package,
    children: [
      { label: 'Purchase Orders',   href: '/d/purchase-orders', icon: ShoppingCart },
      { label: 'GRN (Receipts)',     href: '/d/grn',             icon: ClipboardList },
      { label: 'Re-Invoice',        href: '/d/reinvoice',       icon: ReceiptText },
      { label: 'Suppliers',          href: '/d/suppliers',       icon: Truck },
      { label: 'Shipments',          href: '/d/shipments',       icon: Package },
      { label: 'Stock & Inventory',  href: '/d/stock',           icon: Package },
    ],
  },

  {
    label: 'Finance', icon: Wallet,
    children: [
      { label: 'Expenses',          href: '/d/expenses',          icon: Receipt },
      { label: 'Cash Book',         href: '/d/cash-book',         icon: BookOpenCheck },
      { label: 'Bank Statement',    href: '/d/bank',              icon: Landmark },
      { label: 'Customer Ledger',   href: '/d/customer-ledger',   icon: HandCoins },
      { label: 'Creditors Ledger',  href: '/d/creditors-ledger',  icon: CreditCard },
      { label: 'E-Way Bills',       href: '/d/eway-bills',        icon: FileCheck },
      { label: 'Credit/Debit Notes', href: '/d/credit-notes',     icon: FileText },
      { label: 'Payment Receipts',  href: '/d/receipts',          icon: Receipt },
      { label: 'GST Report',        href: '/d/gst',               icon: BadgePercent },
      { label: 'GST Filing',        href: '/d/gst/filing',        icon: BadgePercent },
      { label: 'P&L Statement',     href: '/d/pl',                icon: TrendingUp },
      { label: 'Trial Balance',     href: '/d/trial-balance',    icon: Scale },
      { label: 'Cash Flow',         href: '/d/cash-flow',        icon: TrendingUp },
      { type: 'section', label: 'Assets & Budget' },
      { label: 'Fixed Assets',      href: '/d/fixed-assets',     icon: CreditCard },
      { label: 'Budget Tracking',   href: '/d/budgets',          icon: TrendingUp },
      { label: 'Investments',       href: '/d/investments',       icon: BarChart2 },
      { label: 'Stock Intelligence', href: '/d/stock-intel',      icon: AlertTriangle },
    ],
  },

  {
    label: 'IT', icon: Shield,
    children: [
      { label: 'Mail',             href: '/d/mail',               icon: Mail },
      { label: 'Chat Analytics',   href: '/d/analytics',          icon: BarChart3 },
      { label: 'Visitor Insights', href: '/d/analytics#orgs',     icon: Eye },
      { label: 'Security Log',     href: '/d/analytics#security', icon: Shield },
      { label: 'Page Views',       href: '/d/analytics#traffic',  icon: Globe },
      { type: 'section', label: 'Audit' },
      { label: 'Audit Trail',      href: '/d/audit',              icon: History },
    ],
  },

  {
    label: 'IMS', icon: Shield,
    children: [
      { label: 'Overview',  href: '/d/ims',      icon: Shield },
      { label: 'SOPs',      href: '/d/ims/sops', icon: BookOpenCheck },
      { label: 'Documents', href: '/d/documents', icon: FileCheck },
    ],
  },

  {
    label: 'Network', icon: Network,
    children: [
      { label: 'REX Members',            href: '/d/rex',                        icon: Network },
      { label: 'Supplier Registrations', href: '/d/supplier-reg/registrations', icon: Building2 },
      { label: 'Customer Registrations', href: '/d/customers/registrations',    icon: UserCheck },
      { label: 'Trading Partners',       href: '/d/trading',                    icon: Scale },
    ],
  },

  { label: 'Settings', href: '/d/settings', icon: Settings2 },
];

function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}
function linkChildren(children: NavChild[]): NavLink[] {
  return children.filter((c): c is NavLink => c.type !== 'section');
}

// ── Mobile drawer group ───────────────────────────────────────────────────────
function MobileGroup({ item, pathname, onNavigate }: {
  item: NavGroup; pathname: string; onNavigate: () => void;
}) {
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
                onClick={onNavigate}
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

// ── MobileNav ─────────────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = { admin: 'Super Admin', client: 'Client' };

export default function MobileNav({ userEmail, userRole = 'admin' }: { userEmail: string; userRole?: string }) {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/dashboard">
          <Image src="/logo.png" alt="Rotehügels" width={110} height={32} priority />
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-zinc-800/60 transition-colors">
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Drawer */}
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
              {NAV.map(item => {
                if (isGroup(item)) {
                  return (
                    <MobileGroup
                      key={item.label}
                      item={item}
                      pathname={pathname}
                      onNavigate={() => setOpen(false)}
                    />
                  );
                }
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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

            <div className="border-t border-zinc-800 px-3 py-4 space-y-2">
              <InstallAppButton />
              <div className="px-4 py-2 rounded-xl bg-zinc-900/60">
                <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                <p className="text-xs text-rose-400 font-medium">{ROLE_LABEL[userRole] ?? userRole}</p>
              </div>
              <a
                href="/api/auth/signout"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
