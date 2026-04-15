# Buddy Handoff → Next Session
Generated: 2026-04-15
Agent: Claude

## Session 15 Apr 2026 — IMS SOPs, Mobile PWA, PDF Viewer, UI Upgrades

### Accomplished
- 36 SOPs across 11 departments with server-side PDF generation (pdfmake)
- IMS section in sidebar with overview, SOP listing, and document registry
- PDF viewer using react-pdf-viewer (PDF.js) — self-hosted fonts and worker
- Invoice converted to server-side PDF with full GST compliance
- Mobile PWA re-invoice app with camera capture at /m/reinvoice
- PWA install button (Android/iOS/Windows/Mac)
- Projects + Stock pages upgraded
- Sidebar/MobileNav fully synced (20+ items added)
- Audit trail fixed (readable labels instead of UUIDs)

### Pending — 5 Reports to Convert
Each needs: API route (pdfmake) + Viewer component + Page update

| Report | File | Lines |
|---|---|---|
| P&L Statement | app/dashboard/accounts/pl/page.tsx | 395 |
| GST Report | app/dashboard/accounts/gst/page.tsx | 271 |
| Quotation | app/dashboard/accounts/quotes/[id]/page.tsx | 354 |
| PO Preview | app/dashboard/accounts/purchase-orders/[id]/preview/page.tsx | 313 |
| Customer Statement | app/dashboard/accounts/customers/[id]/statement/page.tsx | 700+ |

Pattern: see /api/ims/sops/[id]/pdf/route.ts and /api/accounts/orders/[id]/invoice/pdf/route.ts
