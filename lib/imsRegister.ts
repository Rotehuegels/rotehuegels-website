// ── Integrated Management System — Document, Record & Format Registers ──────
// Required by ISO 9001:2015 §7.5 (Documented information), ISO 14001:2015
// §7.5, and ISO 45001:2018 §7.5. Each entry is referenced by the IMS manual
// at /d/ims/manual and shapes what gets retained and for how long.
//
// Three categories:
//   • Documents — controlled, revision-tracked: SOPs, policies, the manual
//     itself, work instructions. Distribution and currency matter.
//   • Records   — evidence of activity: GRN slips, payroll runs, audit logs,
//     calibration certs. Retention period and storage matter.
//   • Formats   — blank templates / forms used to capture records. Each has
//     a unique format number and revision so a printed form can be traced
//     back to the right source.

export type DocumentEntry = {
  id:           string;        // 'DOC-IMS-MANUAL', 'DOC-POL-QUALITY'
  title:        string;
  type:         'manual' | 'policy' | 'sop' | 'work-instruction' | 'register';
  owner:        string;        // role title, not a person
  revision:     string;        // matches the source's current version
  distribution: string[];      // e.g. ['All staff (read-only)', 'Department heads (read-write)']
  source:       string;        // path or system pointer where this lives
};

export type RecordEntry = {
  id:                 string;        // 'REC-FIN-INVOICE', 'REC-WH-GRN'
  title:              string;
  generatedBy:        string;        // SOP id that creates the record
  storage:            string;        // where it lives
  retention:          string;        // e.g. '5 years' or 'Permanent'
  retentionRationale: string;        // statutory or contractual reason
  disposition:        string;        // 'Secure delete', 'Archive', etc.
};

export type FormatEntry = {
  formatNo:   string;        // 'F-PRO-04-INDENT'
  title:      string;
  revision:   string;        // 'Rev 1.0'
  parentSop:  string;        // SOP id this format supports
  status:     'active' | 'obsolete';
  source:     string;        // template path or "system-rendered"
  /** ── Training-pack content (for IMS Manual Appendix D) ──────────────── */
  /** What the form captures and why this form exists at all. */
  purpose?:    string;
  /** Who fills the form (role, not person). */
  whoUses?:    string;
  /** Trigger condition — when must this form be raised. */
  whenUsed?:   string;
  /** Field-by-field summary so a new hire knows what to expect. Kept short
   *  — names + 1-line description per field. */
  keyFields?:  Array<{ label: string; note?: string }>;
  /** What happens after submit: where the record lands, who reviews, what
   *  downstream document or system action is triggered. */
  workflow?:   string;
  /** True when the form is genuinely missing — no live ERP page, no PDF
   *  generator, no offline blank. New hires can't be trained on it until
   *  the blank template is built. Surfaced in Appendix D as "TO BE BUILT". */
  blankPending?: boolean;
};

// ── DOCUMENTS ────────────────────────────────────────────────────────────────
export const DOCUMENTS: DocumentEntry[] = [
  { id: 'DOC-IMS-MANUAL',         title: 'Integrated Management System Manual',                     type: 'manual',  owner: 'Management Representative', revision: '1.0', distribution: ['All staff (read-only)', 'Auditors (controlled copy)'], source: '/d/ims/manual' },
  { id: 'DOC-POL-INTEGRATED',     title: 'Integrated Management Policy',                             type: 'policy',  owner: 'CEO',                       revision: '1.0', distribution: ['Public website', 'Notice boards', 'IMS manual §5'], source: '/d/ims/manual#policy-integrated' },
  { id: 'DOC-POL-QUALITY',        title: 'Quality Policy (ISO 9001)',                                type: 'policy',  owner: 'CEO',                       revision: '1.0', distribution: ['IMS manual §5'], source: '/d/ims/manual#policy-quality' },
  { id: 'DOC-POL-ENVIRONMENT',    title: 'Environmental Policy (ISO 14001)',                         type: 'policy',  owner: 'CEO',                       revision: '1.0', distribution: ['IMS manual §5', 'Plant notice board'], source: '/d/ims/manual#policy-environment' },
  { id: 'DOC-POL-OHS',            title: 'Occupational Health & Safety Policy (ISO 45001)',          type: 'policy',  owner: 'CEO',                       revision: '1.0', distribution: ['IMS manual §5', 'Plant notice board', 'PPE issue point'], source: '/d/ims/manual#policy-ohs' },
  { id: 'DOC-SOP-REGISTER',       title: 'SOP Register (auto-generated)',                            type: 'register', owner: 'Management Representative', revision: 'Live', distribution: ['IMS manual Appendix A'], source: 'lib/sops.ts → ALL_SOPS' },
  { id: 'DOC-DOCUMENT-REGISTER',  title: 'Document Register',                                        type: 'register', owner: 'Management Representative', revision: 'Live', distribution: ['IMS manual Appendix C'], source: 'lib/imsRegister.ts → DOCUMENTS' },
  { id: 'DOC-RECORD-REGISTER',    title: 'Record Register',                                          type: 'register', owner: 'Management Representative', revision: 'Live', distribution: ['IMS manual Appendix C'], source: 'lib/imsRegister.ts → RECORDS' },
  { id: 'DOC-FORMAT-REGISTER',    title: 'Format / Form Register',                                   type: 'register', owner: 'Management Representative', revision: 'Live', distribution: ['IMS manual Appendix C'], source: 'lib/imsRegister.ts → FORMATS' },
];

// ── RECORDS ──────────────────────────────────────────────────────────────────
// Retention periods reflect Indian statutory baselines: Companies Act 2013
// (8 yrs for accounting), CGST Act (6 yrs), Income Tax (8 yrs from end of AY),
// EPF/ESI labour records (5 yrs minimum), CPCB hazardous-waste (5 yrs).
// Where multiple regulators apply, we adopt the longest period.
export const RECORDS: RecordEntry[] = [
  // SALES + AR
  { id: 'REC-SAL-CUSTOMER',         title: 'Customer master record',                            generatedBy: 'SOP-ACC-001', storage: '/d/customers',          retention: 'Life of relationship + 8 years', retentionRationale: 'Companies Act 2013 §128',                  disposition: 'Archive then secure delete' },
  { id: 'REC-SAL-QUOTATION',        title: 'Quotation issued',                                  generatedBy: 'SOP-ACC-005', storage: '/d/quotes',             retention: '8 years',                        retentionRationale: 'Tax audit trail',                          disposition: 'Archive' },
  { id: 'REC-SAL-ORDER',            title: 'Sales order',                                       generatedBy: 'SOP-ACC-003', storage: '/d/orders',             retention: '8 years',                        retentionRationale: 'Companies Act 2013 §128',                  disposition: 'Archive' },
  { id: 'REC-FIN-INVOICE',          title: 'Tax invoice issued',                                generatedBy: 'SOP-ACC-006', storage: '/d/orders/[id]',        retention: '8 years',                        retentionRationale: 'Companies Act + CGST',                     disposition: 'Archive' },
  { id: 'REC-FIN-PAYMENT-RECEIPT',  title: 'Payment receipt',                                   generatedBy: 'SOP-ACC-006', storage: '/d/receipts',           retention: '8 years',                        retentionRationale: 'Companies Act 2013 §128',                  disposition: 'Archive' },
  // PROCUREMENT + WAREHOUSE + AP
  { id: 'REC-PRO-INDENT',           title: 'Indent / purchase requisition',                     generatedBy: 'SOP-PRO-004', storage: '/d/indents',            retention: '8 years',                        retentionRationale: 'Audit trail of demand origination',        disposition: 'Archive' },
  { id: 'REC-PRO-PO',               title: 'Purchase order issued',                             generatedBy: 'SOP-ACC-004', storage: '/d/purchase-orders',    retention: '8 years',                        retentionRationale: 'Companies Act + CGST',                     disposition: 'Archive' },
  { id: 'REC-WH-GRN',               title: 'Goods Receipt Note',                                generatedBy: 'SOP-WH-001',  storage: '/d/grn',                retention: '8 years',                        retentionRationale: 'Companies Act + GST input claim trace',    disposition: 'Archive' },
  { id: 'REC-WH-DISPATCH',          title: 'Dispatch / delivery challan',                       generatedBy: 'SOP-WH-002',  storage: 'Logistics archive',     retention: '8 years',                        retentionRationale: 'CGST + e-way bill trace',                  disposition: 'Archive' },
  { id: 'REC-WH-CYCLECOUNT',        title: 'Cycle count variance log',                          generatedBy: 'SOP-WH-003',  storage: '/d/stock',              retention: '5 years',                        retentionRationale: 'Internal audit + tax inquiry',             disposition: 'Archive' },
  { id: 'REC-FIN-PURCHASE-INVOICE', title: 'Supplier invoice booked',                           generatedBy: 'SOP-ACC-004', storage: '/d/purchase-invoices',  retention: '8 years',                        retentionRationale: 'Companies Act + GST input claim',          disposition: 'Archive' },
  // INVENTORY VALUATION
  { id: 'REC-WH-STOCK-MOVEMENT',    title: 'Stock movement ledger entry',                       generatedBy: 'SOP-PRO-001', storage: '/d/stock/[id]',         retention: '8 years',                        retentionRationale: 'Inventory audit + COGS substantiation',    disposition: 'Archive' },
  { id: 'REC-WH-FIFO-LAYER',        title: 'FIFO cost layer (consumption record)',              generatedBy: 'SOP-PRO-001', storage: 'stock_cost_layers',     retention: '8 years',                        retentionRationale: 'Cost basis for COGS, inventory valuation', disposition: 'Archive' },
  // FINANCE
  { id: 'REC-FIN-EXPENSE',          title: 'Expense voucher',                                   generatedBy: 'SOP-ACC-007', storage: '/d/expenses',           retention: '8 years',                        retentionRationale: 'Tax audit',                                disposition: 'Archive' },
  { id: 'REC-FIN-BANK-RECON',       title: 'Bank reconciliation statement',                     generatedBy: 'SOP-ACC-009', storage: '/d/bank',               retention: '8 years',                        retentionRationale: 'Companies Act',                            disposition: 'Archive' },
  { id: 'REC-FIN-GST-RETURN',       title: 'GST return filed (GSTR-1, 3B, 9)',                  generatedBy: 'SOP-ACC-008', storage: 'GST portal + /d/gst',   retention: '6 years from filing date',       retentionRationale: 'CGST Act §35',                             disposition: 'Archive' },
  { id: 'REC-FIN-PL',               title: 'P&L Statement (period close)',                      generatedBy: 'SOP-ACC-010', storage: '/d/pl',                 retention: 'Permanent',                      retentionRationale: 'Companies Act, statutory financials',      disposition: 'Permanent retention' },
  { id: 'REC-FIN-EWAYBILL',         title: 'E-way bill',                                        generatedBy: 'SOP-ACC-011', storage: '/d/eway-bills',         retention: '8 years',                        retentionRationale: 'CGST + tax audit',                         disposition: 'Archive' },
  // HR + PAYROLL
  { id: 'REC-HR-EMPLOYEE',          title: 'Employee master record',                            generatedBy: 'SOP-HR-001',  storage: '/d/employees',          retention: '8 years post-exit',              retentionRationale: 'Tax + EPF/ESI labour law',                 disposition: 'Archive then secure delete' },
  { id: 'REC-HR-PAYROLL-RUN',       title: 'Payroll run + payslips',                            generatedBy: 'SOP-HR-003',  storage: '/d/payroll',            retention: '8 years',                        retentionRationale: 'EPF/ESI/IT records',                       disposition: 'Archive' },
  { id: 'REC-HR-LEAVE',             title: 'Leave application + balance',                       generatedBy: 'SOP-HR-002',  storage: '/d/leave',              retention: '5 years post-exit',              retentionRationale: 'Labour law inspection',                    disposition: 'Archive' },
  { id: 'REC-ATS-APPLICATION',      title: 'Job application + interview record',                generatedBy: 'SOP-ATS-002', storage: '/d/applications',       retention: '2 years',                        retentionRationale: 'Anti-discrimination evidence; data minimisation', disposition: 'Secure delete' },
  // OPERATIONS + LAB + R&D
  { id: 'REC-OPS-CONTRACT',         title: 'Operations contract + change orders',               generatedBy: 'SOP-OPS-001', storage: '/d/operations',         retention: 'Life of contract + 8 years',     retentionRationale: 'Disputes window + Companies Act',          disposition: 'Archive' },
  { id: 'REC-LAB-RESULT',           title: 'Lab test result + COA',                             generatedBy: 'SOP-OPS-002', storage: 'lab_results',           retention: '5 years',                        retentionRationale: 'Customer redress window + ISO 17025',      disposition: 'Archive' },
  { id: 'REC-RND-TRIAL',            title: 'Pilot trial report + raw data',                     generatedBy: 'SOP-RND-001', storage: '/d/documents',          retention: 'Permanent',                      retentionRationale: 'IP, scale-up reuse, regulatory submissions', disposition: 'Permanent retention' },
  { id: 'REC-RND-METHOD',           title: 'Method validation pack',                            generatedBy: 'SOP-RND-002', storage: '/d/documents',          retention: 'Permanent',                      retentionRationale: 'Method auditability across years',         disposition: 'Permanent retention' },
  // ECOSYSTEM / RECYCLING
  { id: 'REC-ECO-PICKUP',           title: 'E-waste pickup request',                            generatedBy: 'SOP-ECO-001', storage: '/d/recycling/requests', retention: '5 years',                        retentionRationale: 'CPCB EPR record-keeping',                  disposition: 'Archive' },
  { id: 'REC-ECO-CERT',             title: 'Recycling certificate issued',                      generatedBy: 'SOP-ECO-004', storage: '/d/documents',          retention: '5 years',                        retentionRationale: 'CPCB E-Waste Rules 2022',                  disposition: 'Archive' },
  // ENGINEERING & DESIGN
  { id: 'REC-ENG-DRAWING',          title: 'Engineering drawing (issued for construction)',     generatedBy: 'SOP-ENG-001', storage: '/d/projects/[id]',      retention: 'Life of plant + 8 years',        retentionRationale: 'Operating manuals, defect liability',      disposition: 'Archive' },
  { id: 'REC-ENG-PROJECT',          title: 'EPC project dossier',                               generatedBy: 'SOP-ENG-002', storage: '/d/projects/[id]',      retention: 'Life of plant + 8 years',        retentionRationale: 'Warranty + regulatory inspections',        disposition: 'Archive' },
  { id: 'REC-ENG-INSPECTION',       title: 'Equipment inspection / QC report',                  generatedBy: 'SOP-ENG-003', storage: '/d/documents',          retention: '5 years',                        retentionRationale: 'Customer warranty trace',                  disposition: 'Archive' },
  // LEGAL + IT + QUALITY
  { id: 'REC-LEG-CONTRACT',         title: 'Signed contract + addenda',                         generatedBy: 'SOP-LEG-001', storage: '/d/documents',          retention: 'Life of contract + 8 years',     retentionRationale: 'Limitation Act, dispute window',           disposition: 'Permanent retention for material contracts' },
  { id: 'REC-LEG-COMPLIANCE',       title: 'Statutory filing acknowledgement',                  generatedBy: 'SOP-LEG-002', storage: '/d/documents',          retention: '8 years',                        retentionRationale: 'Compliance audit trail',                   disposition: 'Archive' },
  { id: 'REC-IT-AUDIT',             title: 'Audit trail / system access log',                   generatedBy: 'SOP-IT-002',  storage: '/d/audit',              retention: '5 years',                        retentionRationale: 'IT Act + ISO 27001 alignment',             disposition: 'Archive then secure delete' },
  { id: 'REC-QMS-NCR',              title: 'Non-conformance / CAPA record',                     generatedBy: 'SOP-QMS-001', storage: '/d/documents',          retention: '5 years',                        retentionRationale: 'ISO audit cycle (3 yr) + buffer',          disposition: 'Archive' },
  { id: 'REC-QMS-INTERNAL-AUDIT',   title: 'Internal IMS audit report',                         generatedBy: 'SOP-QMS-001', storage: '/d/documents',          retention: '5 years',                        retentionRationale: 'ISO recertification cycle',                disposition: 'Archive' },
];

// ── FORMATS ──────────────────────────────────────────────────────────────────
// Forms are versioned the same way SOPs are. When a SOP changes such that the
// form's structure changes, bump the form revision in lockstep.
//
// Each entry below carries a training-pack payload (purpose / whoUses /
// whenUsed / keyFields / workflow) used by IMS Manual Appendix D. The goal
// is that a new hire can read the manual end-to-end and arrive at their
// first day knowing every form they'll use, what it captures, and what
// happens after they hit Submit.
export const FORMATS: FormatEntry[] = [
  // ── ACCOUNTS / FINANCE ─────────────────────────────────────────────────
  {
    formatNo: 'F-ACC-01-CUSTOMER-REGISTRATION', title: 'Customer Registration Form',
    revision: 'Rev 1.0', parentSop: 'SOP-ACC-001', status: 'active', source: '/customers/register',
    purpose: 'Onboards a new customer into the ERP with all data needed for billing, GST compliance, and credit management.',
    whoUses: 'Customer self-service via portal, or Sales Team on behalf of phone/email leads.',
    whenUsed: 'Before the first quotation or sales order can be raised against a new buyer.',
    keyFields: [
      { label: 'Company name + GSTIN', note: 'Validated against the Indian GST portal' },
      { label: 'PAN', note: 'Required for B2B; cross-checked against GSTIN trade name' },
      { label: 'Contact person + email + phone' },
      { label: 'Billing address + state code', note: 'Drives IGST vs CGST+SGST split' },
      { label: 'Shipping address(es)', note: 'Multiple permitted' },
      { label: 'Credit terms (Net 30 / Net 60 / Advance)', note: 'Approved separately by Management' },
      { label: 'Industry / sub-industry', note: 'Used for segmentation reporting' },
    ],
    workflow: 'On submit, a row is inserted into customer_registrations awaiting Accounts review. Once Accounts approve, a customer record is created with auto-generated customer code; sales team is notified. The original registration row is retained with status=approved as audit evidence (REC-SAL-CUSTOMER).',
  },
  {
    formatNo: 'F-ACC-02-QUOTATION', title: 'Quotation Template (PDF)',
    revision: 'Rev 1.0', parentSop: 'SOP-ACC-005', status: 'active', source: 'lib/quotePdf.ts',
    purpose: 'Standard quotation document issued to prospects and customers. Covers items, pricing, GST, validity, payment terms, and bank details.',
    whoUses: 'Sales Team via /d/quotes. The PDF is generated by lib/quotePdf.ts off the saved quote record.',
    whenUsed: 'Within 24 hours of receiving a customer enquiry.',
    keyFields: [
      { label: 'Quote number (auto QT-YYYY-NNN)' },
      { label: 'Customer + reference + contact', note: 'Prefilled from customer master' },
      { label: 'Line items: description, HSN, qty, UOM, unit price, GST rate' },
      { label: 'Tax split: IGST or CGST+SGST (state-driven)' },
      { label: 'Validity period', note: 'Default 30 days' },
      { label: 'Payment terms + delivery terms' },
      { label: 'Bank details + UPI QR' },
    ],
    workflow: 'Quote PDF is auto-attached to the customer email when /d/quotes/[id] → Send Email is clicked. State moves draft → sent. On customer acceptance the quote converts to a sales order via Convert to Order action.',
  },
  {
    formatNo: 'F-ACC-03-TAX-INVOICE', title: 'Tax Invoice Template (PDF)',
    revision: 'Rev 1.0', parentSop: 'SOP-ACC-006', status: 'active', source: 'lib/invoicePdf.ts',
    purpose: 'GST-compliant tax invoice. Mandatory for every B2B sale; carries the bookkeeping evidence for both parties\' input/output GST claims.',
    whoUses: 'Accounts Team — generated automatically when an order is marked Invoiced at /d/orders/[id].',
    whenUsed: 'On every dispatch / service-completion event.',
    keyFields: [
      { label: 'Invoice number (auto INV-YY-NNN, gap-free counter)' },
      { label: 'Invoice date + place of supply' },
      { label: 'Buyer details with GSTIN' },
      { label: 'Line items with HSN, qty, rate, taxable, GST, total' },
      { label: 'IRN + QR code (e-invoice)', note: 'For B2B above ₹5 Cr aggregate turnover' },
      { label: 'Amount in words + bank details' },
    ],
    workflow: 'Invoice PDF + e-way bill (where applicable) are emailed to the buyer. The record drives GSTR-1 filing (SOP-ACC-008). Payment receipts are reconciled against the invoice in /d/receipts.',
  },
  {
    formatNo: 'F-ACC-04-PO', title: 'Purchase Order Template (PDF)',
    revision: 'Rev 1.0', parentSop: 'SOP-ACC-004', status: 'active', source: 'lib/purchaseOrderPdf.ts',
    purpose: 'Formal commercial commitment to a supplier. Used as the legal document that binds delivery, price, and payment terms.',
    whoUses: 'Procurement Team at /d/purchase-orders/new (or auto-created from an approved indent).',
    whenUsed: 'Before any goods or services can be received from a supplier.',
    keyFields: [
      { label: 'PO number (auto PO-YY-NNN, atomic counter)' },
      { label: 'Supplier with GSTIN' },
      { label: 'Bill-to / ship-to addresses' },
      { label: 'Line items: description, HSN, qty, unit price, GST rate' },
      { label: 'Expected delivery date' },
      { label: 'Payment terms', note: 'Net 30 / Advance / Against Delivery' },
      { label: 'Special instructions, packing/marking' },
    ],
    workflow: 'PO routes through the approval cascade based on amount and the org chart. Once approved, the PO PDF is emailed to the supplier from /d/purchase-orders/[id] → Send. On goods receipt, GRN is raised against the PO; on supplier invoice, three-way match (PO ↔ GRN ↔ Invoice) gates payment.',
  },
  {
    formatNo: 'F-ACC-05-EWAY-BILL', title: 'E-way Bill Generation Format',
    revision: 'Rev 1.0', parentSop: 'SOP-ACC-011', status: 'active', source: '/d/eway-bills/new',
    purpose: 'Statutory document for the inter-state movement of goods worth ≥ ₹50,000. Generated on the GST e-way bill portal and attached to the invoice.',
    whoUses: 'Logistics + Accounts Team.',
    whenUsed: 'For every dispatch over the threshold, before the truck leaves the dock.',
    keyFields: [
      { label: 'Source invoice number + date' },
      { label: 'Consignor / consignee GSTIN + addresses' },
      { label: 'HSN-wise value + GST', note: 'Prefilled from invoice' },
      { label: 'Transporter ID + vehicle number' },
      { label: 'Distance (km) + reason for transport' },
      { label: 'EBN (E-Way Bill Number)', note: 'Returned by GSTN portal' },
    ],
    workflow: 'Generated on the GSTN portal; the EBN and PDF are stored against the invoice in /d/eway-bills. The EBN must accompany the goods in transit; expiry tracking is automated and alerts ops if the truck has exceeded the validity window.',
  },

  // ── PROCUREMENT / WAREHOUSE ────────────────────────────────────────────
  {
    formatNo: 'F-PRO-04-INDENT', title: 'Indent (Purchase Requisition) Form',
    revision: 'Rev 1.0', parentSop: 'SOP-PRO-004', status: 'active', source: '/d/indents/new',
    purpose: 'Internal demand-origination document. Captures what is needed, why, and by when, before any commercial commitment is made to a supplier.',
    whoUses: 'Any department — engineering, lab, ops, admin — needing to source materials or services.',
    whenUsed: 'Before a PO can be raised. Indent → Approval → PO is the standard procurement flow.',
    keyFields: [
      { label: 'Indent number (auto IND-YY-NNNN)' },
      { label: 'Requesting department + cost-centre' },
      { label: 'Required-by date' },
      { label: 'Item lines: description, qty, UOM, estimated unit cost' },
      { label: 'Preferred supplier (optional)' },
      { label: 'Justification / linked project', note: 'Plain-text business reason' },
      { label: 'Attachments: spec sheets, drawings' },
    ],
    workflow: 'Indent enters approval cascade (department head → procurement head → finance, by amount thresholds). Approved indent is convertible to a PO with one click at /d/indents/[id] → Convert to PO; declined indents go back to the requester with notes.',
  },
  {
    formatNo: 'F-WH-01-GRN', title: 'Goods Receipt Note Form',
    revision: 'Rev 1.0', parentSop: 'SOP-WH-001', status: 'active', source: '/d/grn/new',
    purpose: 'Records that physical goods have been received at our premises against a PO. Triggers stock movement, FIFO cost layer creation, and the input GST claim trail.',
    whoUses: 'Warehouse / Stores Team.',
    whenUsed: 'Immediately when goods arrive — before they are physically put away.',
    keyFields: [
      { label: 'GRN number (auto GRN-YY-NNNN)' },
      { label: 'Receipt date' },
      { label: 'Source PO number', note: 'Drives the price / line items' },
      { label: 'Per-line: ordered qty, received qty, accepted qty, rejected qty' },
      { label: 'Rejection reason (if any)' },
      { label: 'Supplier challan / invoice number + date' },
      { label: 'Inspector + receiver signatures' },
    ],
    workflow: 'On submit, accepted quantities post stock_movements rows that bump stock_items.quantity and create a FIFO cost layer at the PO\'s unit cost. Rejected quantities trigger a Debit Note workflow against the supplier. GRN is required for three-way match before the supplier invoice can be posted.',
  },
  {
    formatNo: 'F-WH-02-DISPATCH', title: 'Dispatch / Delivery Challan Form',
    revision: 'Rev 1.0', parentSop: 'SOP-WH-002', status: 'active', source: 'system-rendered',
    purpose: 'Document accompanying outgoing goods. Used for tax invoices, sample shipments, returns to vendor, or stock transfers between locations.',
    whoUses: 'Warehouse / Logistics.',
    whenUsed: 'For every outgoing physical movement of stock.',
    keyFields: [
      { label: 'Challan number (auto DC-YY-NNNN)' },
      { label: 'Date + time of dispatch' },
      { label: 'Consignee + delivery address' },
      { label: 'Per-line: item, qty, UOM, unit price (or sample/no-charge marker)' },
      { label: 'Reason: sale / sample / return / transfer' },
      { label: 'Vehicle number + transporter' },
      { label: 'E-way bill number (if applicable)' },
    ],
    workflow: 'Posts negative stock movement on submit; dispatch is then linked to either an invoice (sales) or kept as a non-billable transfer. The signed challan returned by the consignee is filed in the original transaction folder.',
  },
  {
    formatNo: 'F-WH-03-CYCLECOUNT', title: 'Cycle Count Variance Sheet',
    revision: 'Rev 1.0', parentSop: 'SOP-WH-003', status: 'active', source: '/d/stock', blankPending: true,
    purpose: 'Captures physical-count vs system-stock variance for a chosen item set during a periodic cycle count.',
    whoUses: 'Warehouse Team, supervised by Internal Audit.',
    whenUsed: 'Per the cycle-count plan: A-class items monthly, B-class quarterly, C-class half-yearly. Also on demand after suspected mis-bookings.',
    keyFields: [
      { label: 'Count session ID + date' },
      { label: 'Counter name(s) + supervisor' },
      { label: 'Per-line: item code, location, system qty, physical qty, variance' },
      { label: 'Reason for variance' },
      { label: 'Adjustment authorised by' },
    ],
    workflow: 'Variances over the agreed tolerance are escalated to Operations Head before any stock adjustment is posted. Approved variances post to stock_movements with type=adjustment and the source set to this cycle-count session, preserving the audit trail.',
  },
  {
    formatNo: 'F-WH-04-STOCK-ADJUSTMENT', title: 'Stock Adjustment Form',
    revision: 'Rev 1.0', parentSop: 'SOP-PRO-001', status: 'active', source: '/d/stock/[id]',
    purpose: 'Manual correction to inventory levels — used for breakage, theft, sample consumption, write-offs, and post-cycle-count adjustments.',
    whoUses: 'Warehouse Supervisor, with approval from Operations Head for adjustments above ₹10,000 value.',
    whenUsed: 'Whenever physical reality and system records diverge for a non-routine reason.',
    keyFields: [
      { label: 'Item + location' },
      { label: 'Current system qty + adjusted qty + delta' },
      { label: 'Reason category', note: 'breakage / sample / theft / count-correction / etc.' },
      { label: 'Cost impact', note: 'Auto-calculated from FIFO layers' },
      { label: 'Approver email' },
    ],
    workflow: 'Posts a stock_movement with type=adjustment. For decrements, FIFO layers are consumed in order; for increments a new layer is created at the supplied unit cost. The transaction surfaces in the monthly stock variance report.',
  },

  // ── HR / ATS ───────────────────────────────────────────────────────────
  {
    formatNo: 'F-HR-01-EMPLOYEE-ONBOARD', title: 'Employee Onboarding Checklist',
    revision: 'Rev 1.0', parentSop: 'SOP-HR-001', status: 'active', source: '/d/employees/add',
    purpose: 'Ensures every new hire has the documents, accounts, equipment, and training in place by Day 1.',
    whoUses: 'HR Team.',
    whenUsed: 'Once an offer is accepted; checklist must be 100% complete before joining date.',
    keyFields: [
      { label: 'Personal details + KYC (Aadhaar, PAN)' },
      { label: 'Bank account + UAN', note: 'For salary + EPF' },
      { label: 'Education + experience certificates' },
      { label: 'Position assignment', note: 'Slots into the org-chart cascade' },
      { label: 'Compensation structure (CTC breakdown)' },
      { label: 'IT account creation', note: 'Email, ERP, MFA enrolment' },
      { label: 'Asset issue', note: 'Laptop, ID card, PPE if applicable' },
      { label: 'Mandatory training: IMS overview, OHS induction, IT security' },
    ],
    workflow: 'On Save, the employee row is created and linked to a position; the org-chart updates automatically. Email + ERP accounts are provisioned by IT. A welcome email with first-day instructions is sent. The completed checklist is archived as REC-HR-EMPLOYEE.',
  },
  {
    formatNo: 'F-HR-02-LEAVE-APP', title: 'Leave Application Form',
    revision: 'Rev 1.0', parentSop: 'SOP-HR-002', status: 'active', source: '/d/leave',
    purpose: 'Captures and tracks employee leave applications across all leave types with the appropriate approval route.',
    whoUses: 'Every employee.',
    whenUsed: 'At least 24 hours before the requested leave (except for sick / emergency leave).',
    keyFields: [
      { label: 'Leave type', note: 'Casual / Sick / Earned / LWP / Comp-off' },
      { label: 'From date — to date + half-day flag' },
      { label: 'Reason' },
      { label: 'Handover / coverage', note: 'Who covers in absence' },
      { label: 'Manager email', note: 'Auto-resolved from org chart' },
    ],
    workflow: 'Submission goes to the reporting manager via the approvals system. On approval, leave balance is debited and the leave window is published to the team calendar; on rejection, applicant is notified with the manager\'s notes.',
  },
  {
    formatNo: 'F-HR-03-PAYSLIP', title: 'Payslip Format',
    revision: 'Rev 1.0', parentSop: 'SOP-HR-003', status: 'active', source: '/d/payroll/[runId]/[employeeId]/payslip',
    purpose: 'Statutory monthly payslip showing earnings, deductions, and net pay. Required by Payment of Wages Act and serves as proof of employment for the employee.',
    whoUses: 'Payroll generates; employee consumes.',
    whenUsed: 'On every payroll cycle close (typically last working day of the month).',
    keyFields: [
      { label: 'Pay period + payroll run ID' },
      { label: 'Earnings: basic, HRA, special, OT, bonuses' },
      { label: 'Deductions: EPF, ESI, professional tax, TDS, loans' },
      { label: 'YTD earnings + tax', note: 'For tax-projection compliance' },
      { label: 'Bank details + UAN + PAN' },
      { label: 'Net pay (in figures + words)' },
    ],
    workflow: 'Auto-generated when the payroll run is finalised. Mailed to each employee\'s registered email; available evergreen at the payslip URL. Drives the bank salary upload file and the TDS return.',
  },
  {
    formatNo: 'F-HR-04-EXIT', title: 'Employee Exit / Clearance Form',
    revision: 'Rev 1.0', parentSop: 'SOP-HR-004', status: 'active', source: '/d/employees/[id]',
    purpose: 'Drives a clean separation: assets returned, accounts revoked, dues settled, knowledge handed over.',
    whoUses: 'HR Team, with sign-off from each function (IT, Finance, line manager).',
    whenUsed: 'On resignation acceptance, retirement, or termination — at least one week before LWD (last working day).',
    keyFields: [
      { label: 'Employee + last working day' },
      { label: 'Asset return: laptop, ID card, keys, vehicles' },
      { label: 'Account revocation: email, ERP, GitHub, third-party tools' },
      { label: 'Knowledge handover document', note: 'Linked, not embedded' },
      { label: 'Final settlement: gratuity, leave encashment, notice-period adjustment' },
      { label: 'Exit interview notes (HR)' },
    ],
    workflow: 'Each function signs off in their column; only when 100% complete does HR run final-settlement payroll. On submission, position is vacated in the org chart (cascade re-resolves), and the employee record is moved to status=ex-employee with retention timer.',
  },
  {
    formatNo: 'F-ATS-01-JOB-POSTING', title: 'Job Posting Template',
    revision: 'Rev 1.0', parentSop: 'SOP-ATS-001', status: 'active', source: '/d/jobs/new',
    purpose: 'Captures an open requisition: role, location, must-haves, nice-to-haves, compensation band, hiring manager. Generates the public-careers listing.',
    whoUses: 'Hiring Manager, with HR review before publishing.',
    whenUsed: 'Once headcount and budget are approved.',
    keyFields: [
      { label: 'Title + department + location + employment type' },
      { label: 'Position ID it fills (org chart link)' },
      { label: 'Must-have skills + experience band' },
      { label: 'Compensation range (internal only)' },
      { label: 'Job description + day-to-day' },
      { label: 'Application deadline' },
    ],
    workflow: 'On approve+publish, listing goes live at /careers. Applications come in via /api/ats/apply (linked to F-ATS-02). Hiring manager + HR run the pipeline at /d/applications.',
  },
  {
    formatNo: 'F-ATS-02-APPLICATION', title: 'Job Application Form',
    revision: 'Rev 1.0', parentSop: 'SOP-ATS-002', status: 'active', source: '/careers + /api/ats/apply',
    purpose: 'Public form for candidates to apply against an open requisition.',
    whoUses: 'External candidates (self-service).',
    whenUsed: 'On every interest from a candidate.',
    keyFields: [
      { label: 'Name + email + phone + location' },
      { label: 'LinkedIn URL', note: 'Mandatory' },
      { label: 'CV upload', note: 'Optional but encouraged' },
      { label: 'Years of experience + current company' },
      { label: 'Cover note / why this role' },
      { label: 'Source: how did they hear about us' },
      { label: 'Terms acknowledged checkbox', note: 'Privacy notice + consent' },
    ],
    workflow: 'Lands as a row in applications, visible to the hiring manager + HR. Auto-acknowledgement email sent to candidate. Pipeline moves through screen → interview → offer → joined / rejected, all logged. Personal data is retained 2 years (anti-discrimination evidence + data minimisation).',
  },

  // ── OPERATIONS / LAB ───────────────────────────────────────────────────
  {
    formatNo: 'F-OPS-01-CONTRACT', title: 'Operations Contract Template',
    revision: 'Rev 1.0', parentSop: 'SOP-OPS-001', status: 'active', source: '/d/operations/new',
    purpose: 'Defines the commercial and technical scope of an operations engagement — scope, deliverables, milestones, fees, change-order rules.',
    whoUses: 'Operations Team, signed off by CEO.',
    whenUsed: 'Before any operations work begins for a customer.',
    keyFields: [
      { label: 'Customer + project name + project ID' },
      { label: 'Scope statement', note: 'What\'s in / what\'s out — be explicit' },
      { label: 'Deliverable schedule with milestones' },
      { label: 'Commercial: lump sum, T&M, hybrid' },
      { label: 'Change-order handling clause', note: 'Anything outside scope = priced separately' },
      { label: 'Confidentiality + IP allocation' },
      { label: 'Termination + dispute resolution' },
    ],
    workflow: 'Drafted from the template, signed by both parties, stored in /d/documents and linked to /d/operations/[id]. Drives milestone-based invoicing and project KPIs.',
  },
  {
    formatNo: 'F-OPS-02-LAB-PARAMETER', title: 'Lab Parameter Configuration Sheet',
    revision: 'Rev 1.0', parentSop: 'SOP-OPS-002', status: 'active', source: '/d/operations/lab',
    purpose: 'Per-customer / per-sample-type configuration of which analytes are tested, on which instruments, with which method and limits.',
    whoUses: 'Lab Manager.',
    whenUsed: 'On contract sign-up, and whenever the analyte panel changes.',
    keyFields: [
      { label: 'Customer + sample type', note: 'e.g. zinc dross, e-waste fines' },
      { label: 'Analytes (Cu, Au, Ag, Zn, etc.)' },
      { label: 'Method per analyte', note: 'ICP-OES / AAS / wet-chem / fire assay' },
      { label: 'Instrument' },
      { label: 'LOQ + reporting precision' },
      { label: 'Acceptance criteria / contractual limits' },
    ],
    workflow: 'Saved configuration drives result entry forms and the COA. Method changes bump the form revision and require lab-manager re-approval.',
  },
  {
    formatNo: 'F-OPS-03-COA', title: 'Certificate of Analysis (COA)',
    revision: 'Rev 1.0', parentSop: 'SOP-OPS-002', status: 'active', source: 'system-rendered',
    purpose: 'Statutory output document of a lab test — the result the customer pays for. Used for commercial settlement of metals shipments and for regulatory reporting.',
    whoUses: 'Lab generates; customer consumes.',
    whenUsed: 'On every sample test completion.',
    keyFields: [
      { label: 'COA number + issue date' },
      { label: 'Customer reference + sample ID' },
      { label: 'Sample description, weight, condition on receipt' },
      { label: 'Per-analyte: result, unit, method, instrument, LOQ' },
      { label: 'Lab analyst + lab manager signatures' },
      { label: 'Method validation reference' },
    ],
    workflow: 'Generated when results are signed off in /d/operations/lab. PDF is emailed to the customer and archived in lab_results. Drives commercial settlement: the COA assay × shipment weight × LME → invoice value.',
  },

  // ── R&D ───────────────────────────────────────────────────────────────
  {
    formatNo: 'F-RND-01-TRIAL-CHARTER', title: 'Pilot Trial Charter',
    revision: 'Rev 1.0', parentSop: 'SOP-RND-001', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Charter document for a pilot-plant trial. States hypothesis, success criteria, conditions to be tested, safety + environmental controls.',
    whoUses: 'R&D Lead, signed off by CEO and OHS Officer.',
    whenUsed: 'Before any pilot trial is run on the in-house Zinc Dross Pilot or any equipment at the pilot facility.',
    keyFields: [
      { label: 'Trial name + project ID' },
      { label: 'Hypothesis + success criteria (quantitative)' },
      { label: 'Conditions to vary (DOE table)' },
      { label: 'Equipment + materials' },
      { label: 'Safety: JSA reference + PPE + emergency stops' },
      { label: 'Environmental: effluent / emission / waste plan' },
      { label: 'Approvals (R&D / OHS / CEO)' },
    ],
    workflow: 'Approved charter authorises the trial. Daily run logs and final report are filed against the charter at REC-RND-TRIAL with permanent retention (IP + scale-up reuse).',
  },
  {
    formatNo: 'F-RND-02-METHOD-VALIDATION', title: 'Method Validation Report',
    revision: 'Rev 1.0', parentSop: 'SOP-RND-002', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Validates a new lab method (or a method moved to a new instrument) per ISO 17025 expectations: accuracy, precision, linearity, LOQ, ruggedness.',
    whoUses: 'R&D Method Owner, peer-reviewed by Lab Manager.',
    whenUsed: 'Before a method goes into production; on re-validation triggers (instrument change, calibration drift, customer challenge).',
    keyFields: [
      { label: 'Method name + analyte + matrix' },
      { label: 'Reference standards used + traceability' },
      { label: 'Linearity (R²), LOQ, LOD' },
      { label: 'Accuracy (recovery %)' },
      { label: 'Precision (intra-day RSD, inter-day RSD)' },
      { label: 'Ruggedness (operator, day, instrument)' },
      { label: 'Conclusion + production approval' },
    ],
    workflow: 'Approved validation pack permits the method to be used for chargeable testing. Filed at REC-RND-METHOD with permanent retention. Customers and auditors are entitled to copies for any result they receive.',
  },

  // ── ECOSYSTEM / RECYCLING ─────────────────────────────────────────────
  {
    formatNo: 'F-ECO-01-PICKUP-REQUEST', title: 'E-waste Pickup Request Form',
    revision: 'Rev 1.0', parentSop: 'SOP-ECO-001', status: 'active', source: '/recycling',
    purpose: 'Public-facing form for any company or household to request a pickup of end-of-life IT and electronic waste under our EPR services.',
    whoUses: 'External requester (self-service).',
    whenUsed: 'Whenever a generator wants to dispose of e-waste compliantly.',
    keyFields: [
      { label: 'Generator name + contact' },
      { label: 'Pickup address + state' },
      { label: 'Material categories', note: 'IT equipment, batteries, mobiles, etc.' },
      { label: 'Estimated quantity (kg) + photos' },
      { label: 'Pickup window preference' },
      { label: 'GSTIN (for invoice)' },
    ],
    workflow: 'Lands as a row in /d/recycling/requests. Ops triages and assigns a CPCB-authorised recycler from /d/ecosystem. Pickup is scheduled, manifest is generated, and on completion the recycling certificate (F-ECO-04) is issued. Retained 5 years for CPCB compliance.',
  },
  {
    formatNo: 'F-ECO-04-RECYCLING-CERT', title: 'Certificate of Recycling',
    revision: 'Rev 1.0', parentSop: 'SOP-ECO-004', status: 'active', source: 'system-rendered',
    purpose: 'Statutory certificate confirming that a defined quantity of e-waste was processed by a CPCB-authorised recycler. Mandatory under E-Waste Rules 2022 for the generator\'s EPR balance.',
    whoUses: 'Issued by us on behalf of the recycler partner; consumed by the generator.',
    whenUsed: 'On every completed pickup-and-recycle event.',
    keyFields: [
      { label: 'Certificate number (auto)' },
      { label: 'Generator name + address' },
      { label: 'Recycler name + CPCB authorisation number' },
      { label: 'Material categories + weights' },
      { label: 'Date of receipt + date of processing' },
      { label: 'EPR credits (where applicable)' },
    ],
    workflow: 'Auto-generated after the recycler updates the manifest as Processed. PDF is emailed to the generator and stored in /d/documents. The transaction also accrues to the generator\'s EPR balance for reporting on the CPCB portal.',
  },

  // ── ENGINEERING & DESIGN ──────────────────────────────────────────────
  {
    formatNo: 'F-ENG-01-DRAWING-REGISTER', title: 'Drawing Register / Title Block',
    revision: 'Rev 1.0', parentSop: 'SOP-ENG-001', status: 'active', source: '/d/projects/[id]',
    purpose: 'Master register of every engineering drawing on a project, with revision history, status (IFC, AFC, FOR-INFO), and the standardised title block that goes onto every sheet.',
    whoUses: 'Engineering Team.',
    whenUsed: 'Drawing register is opened on project kick-off and lives until life-of-plant + 8 years.',
    keyFields: [
      { label: 'Drawing number (project-NNN)' },
      { label: 'Title + discipline (P&ID, GA, structural, electrical, ...)' },
      { label: 'Revision + status' },
      { label: 'Drawn by / checked by / approved by' },
      { label: 'Linked ECN if any' },
      { label: 'Issue date + transmittal reference' },
    ],
    workflow: 'Updates to a drawing bump the revision and trigger an Engineering Change Note (ECN) if the drawing was already IFC. Distribution is controlled — only the latest IFC reaches site, all superseded copies stamped Obsolete.',
  },
  {
    formatNo: 'F-ENG-02-PROJECT-CHARTER', title: 'EPC Project Charter',
    revision: 'Rev 1.0', parentSop: 'SOP-ENG-002', status: 'active', source: '/d/projects/new',
    purpose: 'Initiating document for an EPC project. Pins down scope, deliverables, schedule, budget, organisation, and risks before mobilisation.',
    whoUses: 'Project Manager, signed off by CEO + customer.',
    whenUsed: 'On project award, before any procurement or fabrication starts.',
    keyFields: [
      { label: 'Project name + contract reference' },
      { label: 'Scope (engineering, procurement, construction, commissioning)' },
      { label: 'Deliverable list + WBS' },
      { label: 'Schedule with milestones' },
      { label: 'Budget + cost code structure' },
      { label: 'Project org chart + RACI' },
      { label: 'Top 5 risks + mitigations' },
    ],
    workflow: 'Charter governs the project. Variance against schedule or budget feeds into monthly project reviews. Filed at REC-ENG-PROJECT with life-of-plant retention.',
  },
  {
    formatNo: 'F-ENG-03-FAB-ROUTING', title: 'Fabrication Routing Card',
    revision: 'Rev 1.0', parentSop: 'SOP-ENG-003', status: 'active', source: '/d/projects/[id]',
    purpose: 'Travels with a fabrication item through every workstation, capturing operations performed, inspections passed, and defects found.',
    whoUses: 'Production / Workshop Team. Inspector signs off each operation.',
    whenUsed: 'On every fabrication item that is built in-house or at our subcontractor.',
    keyFields: [
      { label: 'Item description + drawing number' },
      { label: 'Material certificate reference (mill TC)' },
      { label: 'Operations sequence (cutting → welding → NDT → painting → final)' },
      { label: 'Per operation: operator, date, inspector signature, hold/release' },
      { label: 'NDT results (where applicable)' },
      { label: 'Final inspection sign-off' },
    ],
    workflow: 'Travels physically with the item; scanned and archived against the project at REC-ENG-INSPECTION. Hold-points cannot be released without inspector signature; defects trigger an NCR (F-QMS-01).',
  },

  // ── LEGAL / COMPLIANCE ────────────────────────────────────────────────
  {
    formatNo: 'F-LEG-01-CONTRACT-REQUEST', title: 'Contract Drafting Request',
    revision: 'Rev 1.0', parentSop: 'SOP-LEG-001', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Internal intake form for any new contract that needs Legal\'s attention — NDAs, MoUs, customer contracts, supplier MSAs.',
    whoUses: 'Any function (Sales, Procurement, HR, R&D); routed to Legal.',
    whenUsed: 'As soon as a counter-party indicates a contract is needed.',
    keyFields: [
      { label: 'Contract type + counter-party' },
      { label: 'Business context (1-paragraph)' },
      { label: 'Key commercial terms', note: 'value, duration, payment terms' },
      { label: 'IP / confidentiality concerns' },
      { label: 'Deadline' },
      { label: 'Internal sponsor + approver' },
    ],
    workflow: 'Legal triages by complexity, picks a base template, and drafts. Redlines roundtrip in /d/documents. Final is signed and archived at REC-LEG-CONTRACT with permanent retention for material contracts.',
  },
  {
    formatNo: 'F-LEG-02-COMPLIANCE-CALENDAR', title: 'Statutory Compliance Calendar',
    revision: 'Rev 1.0', parentSop: 'SOP-LEG-002', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Year-at-a-glance schedule of every statutory filing the company owes — GST returns, TDS, EPF, ESI, ROC, professional tax, factory inspections.',
    whoUses: 'Legal & Compliance Officer; visible to Finance and CEO.',
    whenUsed: 'Reviewed monthly; rebuilt at the start of every financial year.',
    keyFields: [
      { label: 'Filing name + statute' },
      { label: 'Frequency (monthly / quarterly / annual / event)' },
      { label: 'Statutory due date' },
      { label: 'Internal target date', note: 'Buffer against last-minute issues' },
      { label: 'Owner + backup' },
      { label: 'Filing portal + login custodian' },
      { label: 'Last filed date + acknowledgement reference' },
    ],
    workflow: 'Drives the monthly compliance dashboard at /d/compliance. Anything within 7 days of due date with status ≠ filed turns red and pages the owner. Filed acknowledgement is captured at REC-LEG-COMPLIANCE.',
  },

  // ── SOFTWARE & PLATFORM ───────────────────────────────────────────────
  {
    formatNo: 'F-SW-01-RELEASE-NOTES', title: 'Software Release Notes Template',
    revision: 'Rev 1.0', parentSop: 'SOP-SW-001', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Standardises every release of AutoREX / Operon ERP / LabREX with: what shipped, what changed, who is impacted, what to test, what to communicate.',
    whoUses: 'Software Engineering, reviewed by CTO.',
    whenUsed: 'On every production release.',
    keyFields: [
      { label: 'Release version + date + commit SHA' },
      { label: 'Modules touched' },
      { label: 'Features (with screenshot links)' },
      { label: 'Bug fixes (with issue refs)' },
      { label: 'Breaking changes + migration notes' },
      { label: 'Test plan + sign-off' },
      { label: 'Rollback procedure' },
    ],
    workflow: 'Filled before deploy; published to /releases and the all-hands channel; archived against the release tag in git. Drives customer-facing change comms where required.',
  },

  // ── QUALITY MANAGEMENT ────────────────────────────────────────────────
  {
    formatNo: 'F-QMS-01-NCR', title: 'Non-Conformance Report (NCR)',
    revision: 'Rev 1.0', parentSop: 'SOP-QMS-001', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Captures any product, process, or supplier non-conformance — the controlled record that drives root-cause analysis and CAPA.',
    whoUses: 'Anyone observing a non-conformance — production, lab, warehouse, customer-success. Closed by the Quality Function.',
    whenUsed: 'The moment a non-conformance is identified. There is no threshold — every NCR is logged.',
    keyFields: [
      { label: 'NCR number (auto NCR-YY-NNN)' },
      { label: 'Date + originator' },
      { label: 'Source: in-house / supplier / customer complaint' },
      { label: 'Description of the non-conformance' },
      { label: 'Immediate containment action' },
      { label: 'Root cause (5-Whys / fishbone)' },
      { label: 'Corrective action + owner + due date' },
      { label: 'Effectiveness verification' },
      { label: 'Closure approval' },
    ],
    workflow: 'NCR opens, containment within 24 h, RCA within 5 working days, CAPA within 30 days. Verification of effectiveness happens at the next quality review. Repeat NCRs against the same SOP trigger a SOP revision (logged in the SOP\'s change history).',
  },
  {
    formatNo: 'F-QMS-02-INTERNAL-AUDIT', title: 'Internal Audit Checklist',
    revision: 'Rev 1.0', parentSop: 'SOP-QMS-001', status: 'active', source: '/d/documents', blankPending: true,
    purpose: 'Structured checklist used during an internal IMS audit to confirm a department\'s compliance with the SOPs, this manual, and the relevant ISO clauses.',
    whoUses: 'Internal Auditor (cannot audit own department).',
    whenUsed: 'Per the annual internal audit programme; risk-weighted areas more frequent.',
    keyFields: [
      { label: 'Audit ID + date + lead auditor' },
      { label: 'Department audited + clause/SOP scope' },
      { label: 'Per-checklist item: requirement, evidence reviewed, finding (Conform / Minor NC / Major NC / OFI)' },
      { label: 'Auditee acknowledgement' },
      { label: 'Findings summary + statistics' },
    ],
    workflow: 'Findings get logged as NCRs (F-QMS-01) for non-conformities and as Opportunities for Improvement otherwise. Audit report is presented at the next Management Review. Retained 5 years (full ISO recertification cycle + buffer).',
  },

  // ── IT / SECURITY ─────────────────────────────────────────────────────
  {
    formatNo: 'F-IT-01-ACCESS-REVIEW', title: 'User Access Review Form',
    revision: 'Rev 1.0', parentSop: 'SOP-IT-002', status: 'active', source: '/d/admin/users',
    purpose: 'Periodic re-attestation that every active ERP user still needs the access they have. Prevents privilege creep and orphaned ex-employee accounts.',
    whoUses: 'IT Admin runs the review; managers attest for their reports.',
    whenUsed: 'Quarterly, with an extra spot-check after large org changes.',
    keyFields: [
      { label: 'Review session ID + period' },
      { label: 'Per user: role, modules, last-login, manager' },
      { label: 'Manager attestation: keep / change / revoke' },
      { label: 'Justification for elevated roles' },
      { label: 'Sign-off (manager → IT admin)' },
    ],
    workflow: 'Approved reductions are applied immediately; approved elevations require CEO co-sign for admin role. The review log is retained 5 years (REC-IT-AUDIT) and is the first artefact requested in any IT-security audit.',
  },
];
