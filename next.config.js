/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist (via @react-pdf-viewer) does a runtime `require('canvas')` for
  // its Node-only fallback. We never render PDFs server-side, so stub canvas
  // to an empty module — works for both Turbopack and Webpack builds.
  serverExternalPackages: ['canvas'],
  // Turbopack's production chunk splitter fails for these packages with
  // "module factory is not available" when they're loaded via next/dynamic
  // (they use older CJS patterns Turbopack doesn't correctly register in
  // async chunks). Transpiling them through Next's full pipeline avoids it.
  transpilePackages: [
    'leaflet',
    'leaflet.markercluster',
    'react-leaflet',
    '@react-leaflet/core',
    'react-leaflet-cluster',
  ],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: './scripts/empty.js',
    },
  },

  outputFileTracingIncludes: {
    '/api/private/signature': ['./private/**'],
    '/api/ims/sops/[id]/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/orders/[id]/invoice/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
      './private/signature.jpg',
    ],
    '/api/accounts/quotes/[id]/proforma/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
      './private/signature.jpg',
    ],
    '/api/accounts/quotes/[id]/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
      './private/signature.jpg',
    ],
    '/api/accounts/purchase-orders/[id]/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
      './private/signature.jpg',
    ],
    '/api/accounts/grn/[id]/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
      './private/signature.jpg',
    ],
    '/api/eway-bills/[id]/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/gst/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/pl/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/balance-sheet/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/customers/[id]/statement/pdf': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/trial-balance': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
    '/api/accounts/cash-flow': [
      './public/fonts/Roboto/**',
      './public/assets/Logo2_black.png',
    ],
  },

  // ── Security headers ────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()' },
          // 2-year HSTS with preload — submit domain to hstspreload.org after first prod deploy
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
      {
        source: '/:file(logo\\.png|logo\\.jpg|favicon\\.ico|apple-touch-icon\\.png|autorex-logo\\.jpg)',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },

  // ── Clean URL rewrites — hide internal folder structure ──────────────
  async redirects() {
    return [
      { source: '/ewaste', destination: '/recycling', permanent: true },
      { source: '/ewaste/:path*', destination: '/recycling/:path*', permanent: true },
      // Public directory moved from /recycling/recyclers → /ecosystem
      { source: '/recycling/recyclers', destination: '/ecosystem', permanent: true },
      { source: '/recycling/recyclers/:code', destination: '/ecosystem/:code', permanent: true },
      // Service-pillar rename (Apr 2026)
      { source: '/services/research', destination: '/services/testwork-feasibility', permanent: true },
      { source: '/services/business', destination: '/services/plant-epc', permanent: true },
      { source: '/services/consultancy', destination: '/services/operations-advisory', permanent: true },
    ];
  },
  async rewrites() {
    return [
      // ── Mobile PWA shortcuts (/m/...) ──────────────────────────────
      { source: '/m/reinvoice', destination: '/mobile/reinvoice' },

      // ── Recycling operations dashboard ────────────────────────────
      { source: '/d/recycling', destination: '/dashboard/recycling' },
      { source: '/d/recycling/requests', destination: '/dashboard/recycling/requests' },

      // ── Ecosystem directory (internal) ────────────────────────────
      { source: '/d/ecosystem', destination: '/dashboard/ecosystem' },
      { source: '/d/ecosystem/:code', destination: '/dashboard/ecosystem/:code' },

      // ── Marketplace moderation (internal) ─────────────────────────
      { source: '/d/marketplace', destination: '/dashboard/marketplace' },

      // ── IMS shortcuts ─────────────────────────────────────────────
      { source: '/d/ims', destination: '/dashboard/ims' },
      { source: '/d/ims/sops', destination: '/dashboard/ims/sops' },
      { source: '/d/ims/sops/:id', destination: '/dashboard/ims/sops/:id' },

      // ── Dashboard shortcuts (/d/...) ──────────────────────────────
      // Overview
      { source: '/d', destination: '/dashboard' },
      { source: '/d/settings', destination: '/dashboard/settings' },

      // Sales
      { source: '/d/customers', destination: '/dashboard/accounts/customers' },
      { source: '/d/customers/new', destination: '/dashboard/accounts/customers/new' },
      { source: '/d/customers/:id', destination: '/dashboard/accounts/customers/:id' },
      { source: '/d/customers/:id/edit', destination: '/dashboard/accounts/customers/:id/edit' },
      { source: '/d/customers/:id/statement', destination: '/dashboard/accounts/customers/:id/statement' },
      { source: '/d/customers/:id/statement/preview', destination: '/dashboard/accounts/customers/:id/statement/preview' },
      { source: '/d/customers/registrations', destination: '/dashboard/accounts/customers/registrations' },
      { source: '/d/customers/leads', destination: '/dashboard/accounts/customers/leads' },
      { source: '/d/catalog', destination: '/dashboard/accounts/items' },
      { source: '/d/catalog/new', destination: '/dashboard/accounts/items/new' },
      { source: '/d/catalog/:id', destination: '/dashboard/accounts/items/:id' },
      { source: '/d/quotes', destination: '/dashboard/accounts/quotes' },
      { source: '/d/quotes/new', destination: '/dashboard/accounts/quotes/new' },
      { source: '/d/quotes/:id', destination: '/dashboard/accounts/quotes/:id' },
      { source: '/d/quotes/:id/edit', destination: '/dashboard/accounts/quotes/:id/edit' },
      { source: '/d/quotes/:id/preview', destination: '/dashboard/accounts/quotes/:id/preview' },
      { source: '/d/quotes/:id/proforma', destination: '/dashboard/accounts/quotes/:id/proforma' },
      { source: '/d/orders', destination: '/dashboard/accounts/orders' },
      { source: '/d/orders/new', destination: '/dashboard/accounts/orders/new' },
      { source: '/d/recurring-orders', destination: '/dashboard/accounts/recurring-orders' },
      { source: '/d/orders/:id', destination: '/dashboard/accounts/orders/:id' },
      { source: '/d/orders/:id/edit', destination: '/dashboard/accounts/orders/:id/edit' },
      { source: '/d/orders/:id/edit', destination: '/dashboard/accounts/orders/:id/edit' },
      { source: '/d/orders/:id/invoice', destination: '/dashboard/accounts/orders/:id/invoice' },

      // Procurement
      { source: '/d/indents', destination: '/dashboard/indents' },
      { source: '/d/indents/new', destination: '/dashboard/indents/new' },
      { source: '/d/indents/:id', destination: '/dashboard/indents/:id' },
      { source: '/d/purchase-orders', destination: '/dashboard/accounts/purchase-orders' },
      { source: '/d/purchase-orders/new', destination: '/dashboard/accounts/purchase-orders/new' },
      { source: '/d/purchase-orders/:id', destination: '/dashboard/accounts/purchase-orders/:id' },
      { source: '/d/purchase-orders/:id/edit', destination: '/dashboard/accounts/purchase-orders/:id/edit' },
      { source: '/d/purchase-orders/:id/preview', destination: '/dashboard/accounts/purchase-orders/:id/preview' },
      { source: '/d/purchase-invoices', destination: '/dashboard/accounts/purchase-invoices' },
      { source: '/d/purchase-invoices/new', destination: '/dashboard/accounts/purchase-invoices/new' },
      { source: '/d/purchase-invoices/:id', destination: '/dashboard/accounts/purchase-invoices/:id' },
      { source: '/d/suppliers', destination: '/dashboard/accounts/suppliers' },
      { source: '/d/suppliers/new', destination: '/dashboard/accounts/suppliers/new' },
      { source: '/d/suppliers/:id', destination: '/dashboard/accounts/suppliers/:id' },
      { source: '/d/suppliers/:id/edit', destination: '/dashboard/accounts/suppliers/:id/edit' },
      { source: '/d/reinvoice', destination: '/dashboard/accounts/purchase-orders/reinvoice' },
      { source: '/d/grn', destination: '/dashboard/accounts/grn' },
      { source: '/d/grn/new', destination: '/dashboard/accounts/grn/new' },
      { source: '/d/grn/:id', destination: '/dashboard/accounts/grn/:id' },
      { source: '/d/budgets', destination: '/dashboard/accounts/budgets' },
      { source: '/d/fixed-assets', destination: '/dashboard/accounts/fixed-assets' },
      { source: '/d/fixed-assets/new', destination: '/dashboard/accounts/fixed-assets/new' },
      { source: '/d/fixed-assets/:id', destination: '/dashboard/accounts/fixed-assets/:id' },
      { source: '/d/stock', destination: '/dashboard/accounts/stock' },
      { source: '/d/stock/:id/edit', destination: '/dashboard/accounts/stock/:id/edit' },

      // Finance
      { source: '/d/expenses', destination: '/dashboard/accounts/expenses' },
      { source: '/d/expenses/new', destination: '/dashboard/accounts/expenses/new' },
      { source: '/d/expenses/:id', destination: '/dashboard/accounts/expenses/:id' },
      { source: '/d/expenses/:id/edit', destination: '/dashboard/accounts/expenses/:id/edit' },
      { source: '/d/eway-bills', destination: '/dashboard/accounts/eway-bills' },
      { source: '/d/eway-bills/new', destination: '/dashboard/accounts/eway-bills/new' },
      { source: '/d/eway-bills/:id', destination: '/dashboard/accounts/eway-bills/:id' },
      { source: '/d/credit-notes', destination: '/dashboard/accounts/credit-notes' },
      { source: '/d/credit-notes/new', destination: '/dashboard/accounts/credit-notes/new' },
      { source: '/d/receipts', destination: '/dashboard/accounts/receipts' },
      { source: '/d/receipts/new', destination: '/dashboard/accounts/receipts/new' },
      { source: '/d/cash-book', destination: '/dashboard/accounts/cash-book' },
      { source: '/d/customer-ledger', destination: '/dashboard/accounts/customer-ledger' },
      { source: '/d/creditors-ledger', destination: '/dashboard/accounts/creditors-ledger' },
      { source: '/d/bank', destination: '/dashboard/accounts/bank' },
      { source: '/d/gst', destination: '/dashboard/accounts/gst' },
      { source: '/d/gst/filing', destination: '/dashboard/accounts/gst/filing' },
      { source: '/d/pl', destination: '/dashboard/accounts/pl' },
      { source: '/d/balance-sheet', destination: '/dashboard/accounts/balance-sheet' },
      { source: '/d/trial-balance', destination: '/dashboard/accounts/trial-balance' },
      { source: '/d/cash-flow', destination: '/dashboard/accounts/cash-flow' },
      { source: '/d/pl/preview', destination: '/dashboard/accounts/pl/preview' },
      { source: '/d/investments', destination: '/dashboard/investments' },
      { source: '/d/stock-intel', destination: '/dashboard/stock-intelligence' },
      { source: '/d/stock-intel/:symbol', destination: '/dashboard/stock-intelligence/:symbol' },

      // People
      { source: '/d/employees', destination: '/dashboard/hr/employees' },
      { source: '/d/org-chart', destination: '/dashboard/hr/org-chart' },
      { source: '/d/employees/add', destination: '/dashboard/hr/add' },
      { source: '/d/employees/:id', destination: '/dashboard/hr/employees/:id' },
      { source: '/d/employees/:id/edit', destination: '/dashboard/hr/employees/:id/edit' },
      { source: '/d/trading', destination: '/dashboard/accounts/trading' },
      { source: '/d/shipments', destination: '/dashboard/accounts/shipments' },
      { source: '/d/shipments/:id', destination: '/dashboard/accounts/shipments/:id' },
      { source: '/d/leave', destination: '/dashboard/hr/leave' },
      { source: '/d/payroll', destination: '/dashboard/payroll' },
      { source: '/d/payroll/new', destination: '/dashboard/payroll/new' },
      { source: '/d/payroll/setup', destination: '/dashboard/payroll/setup' },
      { source: '/d/payroll/:id', destination: '/dashboard/payroll/:id' },
      { source: '/d/payroll/:id/edit', destination: '/dashboard/payroll/:id/edit' },
      { source: '/d/jobs', destination: '/dashboard/ats/jobs' },
      { source: '/d/jobs/new', destination: '/dashboard/ats/jobs/new' },
      { source: '/d/jobs/:id', destination: '/dashboard/ats/jobs/:id' },
      { source: '/d/jobs/:id/edit', destination: '/dashboard/ats/jobs/:id/edit' },
      { source: '/d/applications', destination: '/dashboard/ats/applications' },
      { source: '/d/applications/:id', destination: '/dashboard/ats/applications/:id' },

      // Projects & Operations
      { source: '/d/projects', destination: '/dashboard/projects' },
      { source: '/d/projects/new', destination: '/dashboard/projects/new' },
      { source: '/d/projects/:id', destination: '/dashboard/projects/:id' },
      { source: '/d/projects/:id/edit', destination: '/dashboard/projects/:id/edit' },
      { source: '/d/operations', destination: '/dashboard/operations' },
      { source: '/d/operations/lab', destination: '/dashboard/operations/lab' },
      { source: '/d/operations/:id', destination: '/dashboard/operations/:id' },

      // IT & Quality
      { source: '/d/mail', destination: '/dashboard/mail' },
      { source: '/d/mail/compose', destination: '/dashboard/mail/compose' },
      { source: '/d/mail/:id', destination: '/dashboard/mail/:id' },
      { source: '/d/analytics', destination: '/dashboard/analytics' },
      { source: '/d/audit', destination: '/dashboard/audit' },
      { source: '/d/documents', destination: '/dashboard/documents' },
      { source: '/d/documents/:id', destination: '/dashboard/documents/:id' },
      { source: '/d/intelligence', destination: '/dashboard/intelligence' },
      { source: '/d/markets', destination: '/dashboard/markets' },
      { source: '/d/bookings', destination: '/dashboard/bookings' },
      { source: '/d/admin/users', destination: '/dashboard/admin/users' },
      { source: '/d/admin/users/new', destination: '/dashboard/admin/users/new' },
      { source: '/d/admin/users/:id', destination: '/dashboard/admin/users/:id' },
      { source: '/d/forbidden', destination: '/dashboard/forbidden' },
      { source: '/d/rex', destination: '/dashboard/rex' },
      { source: '/d/supplier-reg', destination: '/dashboard/suppliers' },
      { source: '/d/supplier-reg/registrations', destination: '/dashboard/suppliers/registrations' },

      // ── Portal shortcuts (/p/...) ─────────────────────────────────
      { source: '/p', destination: '/portal' },
      { source: '/p/:projectId', destination: '/portal/:projectId' },
      { source: '/p/:projectId/milestones', destination: '/portal/:projectId/milestones' },
      { source: '/p/:projectId/payments', destination: '/portal/:projectId/payments' },
      { source: '/p/:projectId/changes', destination: '/portal/:projectId/changes' },
      { source: '/p/:projectId/changes/new', destination: '/portal/:projectId/changes/new' },
      { source: '/p/:projectId/deliveries', destination: '/portal/:projectId/deliveries' },
      { source: '/p/:projectId/documents', destination: '/portal/:projectId/documents' },
      { source: '/p/:projectId/activity', destination: '/portal/:projectId/activity' },
      { source: '/p/:projectId/operations', destination: '/portal/:projectId/operations' },
      { source: '/p/:projectId/operations/production', destination: '/portal/:projectId/operations/production' },
      { source: '/p/:projectId/operations/roi', destination: '/portal/:projectId/operations/roi' },
      { source: '/p/:projectId/operations/lab', destination: '/portal/:projectId/operations/lab' },
      { source: '/p/:projectId/operations/lab/:sampleId', destination: '/portal/:projectId/operations/lab/:sampleId' },
    ];
  },
};
module.exports = nextConfig;
