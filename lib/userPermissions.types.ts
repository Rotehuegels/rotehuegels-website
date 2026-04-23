// lib/userPermissions.types.ts
// Client-safe permission catalogue + types — no server-only deps so React
// client components can render the checkbox grid without pulling supabase
// admin into the bundle.

export type UserRole = 'admin' | 'staff' | 'client';

export interface UserRow {
  id: string;
  email: string;
  role: UserRole | null;
  display_name: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  customer_id: string | null;
  customer_name: string | null;
  permission_count: number;
  auth_created_at: string | null;
  last_sign_in_at: string | null;
}

// Permission catalogue — edited here and reflected everywhere.
// Keep keys short + dotted so they read naturally in checks like
// hasPermission('projects.edit').
export interface PermissionDef {
  key: string;
  label: string;
  description?: string;
}
export interface PermissionModule {
  key: string;             // 'projects'
  label: string;           // 'Projects & Tasks'
  description?: string;
  permissions: PermissionDef[];
}

export const PERMISSION_CATALOGUE: PermissionModule[] = [
  {
    key: 'projects',
    label: 'Projects & Tasks',
    description: 'Engineering projects, milestones, tasks, kanban, change requests.',
    permissions: [
      { key: 'projects.view',   label: 'View projects and tasks' },
      { key: 'projects.create', label: 'Create projects' },
      { key: 'projects.edit',   label: 'Edit projects and tasks' },
      { key: 'projects.delete', label: 'Delete tasks / change requests' },
      { key: 'projects.manage_clients', label: 'Provision client-portal accounts' },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    description: 'Customers, quotes, orders, invoices.',
    permissions: [
      { key: 'sales.view',         label: 'View customers / quotes / orders' },
      { key: 'sales.create',       label: 'Create quotes and orders' },
      { key: 'sales.edit',         label: 'Edit quotes and orders' },
      { key: 'sales.approve',      label: 'Approve quotes, issue invoices' },
      { key: 'sales.intelligence', label: 'Market Intelligence dashboard' },
    ],
  },
  {
    key: 'procurement',
    label: 'Procurement',
    description: 'Suppliers, POs, GRN, shipments, stock.',
    permissions: [
      { key: 'procurement.view',    label: 'View suppliers, POs, GRN' },
      { key: 'procurement.create',  label: 'Create POs and GRN' },
      { key: 'procurement.edit',    label: 'Edit procurement records' },
      { key: 'procurement.approve', label: 'Approve POs, reinvoice' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    description: 'Ledger, expenses, P&L, GST.',
    permissions: [
      { key: 'finance.view',    label: 'View ledger, expenses, cash book' },
      { key: 'finance.edit',    label: 'Post expenses and adjustments' },
      { key: 'finance.approve', label: 'Approve payments and receipts' },
      { key: 'finance.gst',     label: 'GST filing and e-way bills' },
      { key: 'finance.reports', label: 'Download P&L / Trial Balance / Cash Flow' },
    ],
  },
  {
    key: 'hr',
    label: 'People (HR / Payroll)',
    description: 'Employees, leave, payroll, recruitment.',
    permissions: [
      { key: 'hr.view',       label: 'View employees and org chart' },
      { key: 'hr.edit',       label: 'Edit employee records' },
      { key: 'hr.payroll',    label: 'Run payroll' },
      { key: 'hr.recruitment',label: 'Manage job postings and applications' },
    ],
  },
  {
    key: 'circular',
    label: 'Circular / Ecosystem',
    description: 'Recycler directory, marketplace, EPR.',
    permissions: [
      { key: 'circular.view',   label: 'View ecosystem directory' },
      { key: 'circular.edit',   label: 'Enrich recycler records' },
      { key: 'circular.market', label: 'Moderate marketplace listings' },
    ],
  },
  {
    key: 'bookings',
    label: 'Bookings',
    description: 'Demo and consultation scheduling.',
    permissions: [
      { key: 'bookings.view',    label: 'View bookings' },
      { key: 'bookings.manage',  label: 'Cancel bookings / manage event types' },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    description: 'User management, settings, audit.',
    permissions: [
      { key: 'admin.users',    label: 'Manage users and rights' },
      { key: 'admin.settings', label: 'Edit company settings' },
      { key: 'admin.audit',    label: 'View audit log' },
    ],
  },
];

/** Flatten the catalogue into a Set for quick validation. */
export const VALID_PERMISSION_KEYS: Set<string> = new Set(
  PERMISSION_CATALOGUE.flatMap(m => m.permissions.map(p => p.key)),
);

/** Group permissions by module for grid rendering. */
export function permissionsByModule(): PermissionModule[] {
  return PERMISSION_CATALOGUE;
}
