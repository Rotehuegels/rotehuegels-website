// components/dashboard/permissionMap.ts
// Maps dashboard hrefs to the permission catalogue keys that gate them.
// Kept in sync with the layout.tsx guards under app/dashboard/*. Used by
// the Sidebar / MobileNav to hide nav items the current user cannot open.

const HREF_TO_PERMISSION: Array<[prefix: string, permission: string]> = [
  // Projects
  ['/d/projects',         'projects.view'],

  // Sales
  ['/d/customers',        'sales.view'],
  ['/d/quotes',           'sales.view'],
  ['/d/orders',           'sales.view'],
  ['/d/recurring-orders', 'sales.view'],
  ['/d/trading',          'sales.view'],
  ['/d/catalog',          'sales.view'],
  ['/d/leads',            'sales.view'],
  ['/d/intelligence',     'sales.intelligence'],
  ['/d/markets',          'sales.intelligence'],
  ['/d/stock-intel',      'sales.intelligence'],

  // Procurement
  ['/d/indents',           'procurement.view'],
  ['/d/purchase-orders',   'procurement.view'],
  ['/d/purchase-invoices', 'procurement.view'],
  ['/d/grn',               'procurement.view'],
  ['/d/suppliers',        'procurement.view'],
  ['/d/shipments',        'procurement.view'],
  ['/d/stock',            'procurement.view'],
  ['/d/reinvoice',        'procurement.view'],

  // Finance — core
  ['/d/expenses',         'finance.view'],
  ['/d/bank',             'finance.view'],
  ['/d/cash-book',        'finance.view'],
  ['/d/customer-ledger',  'finance.view'],
  ['/d/creditors-ledger', 'finance.view'],
  ['/d/credit-notes',     'finance.view'],
  ['/d/receipts',         'finance.view'],
  ['/d/budgets',          'finance.view'],
  ['/d/fixed-assets',     'finance.view'],
  ['/d/investments',      'finance.view'],
  // Finance — GST
  ['/d/eway-bills',       'finance.gst'],
  ['/d/gst',              'finance.gst'],
  // Finance — reports
  ['/d/pl',               'finance.reports'],
  ['/d/trial-balance',    'finance.reports'],
  ['/d/cash-flow',        'finance.reports'],
  ['/d/balance-sheet',    'finance.reports'],

  // HR / People
  ['/d/employees',        'hr.view'],
  ['/d/org-chart',        'hr.view'],
  ['/d/leave',            'hr.view'],
  ['/d/payroll',          'hr.payroll'],
  ['/d/jobs',             'hr.recruitment'],
  ['/d/applications',     'hr.recruitment'],

  // Circular
  ['/d/ecosystem',        'circular.edit'],
  ['/d/recycling',        'circular.market'],
  ['/d/marketplace',      'circular.market'],

  // Bookings
  ['/d/bookings',         'bookings.view'],

  // Operations (plant contracts + lab parameters)
  ['/d/operations',       'operations.view'],

  // IMS (SOPs + controlled documents)
  ['/d/ims',              'ims.view'],
  ['/d/documents',        'ims.view'],

  // Network & registrations
  ['/d/rex',                          'network.view'],
  ['/d/supplier-reg',                 'network.moderate'],
  ['/d/supplier-reg/registrations',   'network.moderate'],
  ['/d/customers/registrations',      'network.moderate'],

  // IT / Mail / Analytics
  ['/d/mail',             'it.mail'],
  ['/d/analytics',        'it.analytics'],

  // Administration
  ['/d/admin',            'admin.users'],
  ['/d/settings',         'admin.settings'],
  ['/d/audit',            'admin.audit'],
];

// Longest prefix wins — so /d/gst/filing matches finance.gst before
// anything registering /d/g* would.
const SORTED = [...HREF_TO_PERMISSION].sort((a, b) => b[0].length - a[0].length);

/** Permission required to open the given href, or null for always-visible items. */
export function hrefToPermission(href: string): string | null {
  for (const [prefix, key] of SORTED) {
    if (href === prefix || href.startsWith(prefix + '/') || href.startsWith(prefix + '#') || href.startsWith(prefix + '?')) {
      return key;
    }
  }
  return null;
}

/**
 * Decide whether a given href should be visible to a user with the given
 * permission set. `permissions === null` means the user is an admin and
 * sees everything. Unknown hrefs (no permission mapping) are visible by
 * default so we don't accidentally hide future links.
 */
export function canSeeHref(href: string, permissions: Set<string> | null): boolean {
  if (permissions === null) return true;
  const needed = hrefToPermission(href);
  if (!needed) return true;
  return permissions.has(needed);
}
