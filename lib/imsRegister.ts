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
export const FORMATS: FormatEntry[] = [
  { formatNo: 'F-ACC-01-CUSTOMER-REGISTRATION',  title: 'Customer Registration Form',          revision: 'Rev 1.0', parentSop: 'SOP-ACC-001', status: 'active', source: '/customers/register'                 },
  { formatNo: 'F-ACC-02-QUOTATION',              title: 'Quotation Template (PDF)',             revision: 'Rev 1.0', parentSop: 'SOP-ACC-005', status: 'active', source: 'lib/quotePdf.ts'                     },
  { formatNo: 'F-ACC-03-TAX-INVOICE',            title: 'Tax Invoice Template (PDF)',           revision: 'Rev 1.0', parentSop: 'SOP-ACC-006', status: 'active', source: 'lib/invoicePdf.ts'                   },
  { formatNo: 'F-ACC-04-PO',                     title: 'Purchase Order Template (PDF)',        revision: 'Rev 1.0', parentSop: 'SOP-ACC-004', status: 'active', source: 'lib/purchaseOrderPdf.ts'             },
  { formatNo: 'F-ACC-05-EWAY-BILL',              title: 'E-way Bill Generation Format',         revision: 'Rev 1.0', parentSop: 'SOP-ACC-011', status: 'active', source: '/d/eway-bills/new'                   },
  { formatNo: 'F-PRO-04-INDENT',                 title: 'Indent (Purchase Requisition) Form',   revision: 'Rev 1.0', parentSop: 'SOP-PRO-004', status: 'active', source: '/d/indents/new'                      },
  { formatNo: 'F-WH-01-GRN',                     title: 'Goods Receipt Note Form',              revision: 'Rev 1.0', parentSop: 'SOP-WH-001',  status: 'active', source: '/d/grn/new'                          },
  { formatNo: 'F-WH-02-DISPATCH',                title: 'Dispatch / Delivery Challan Form',     revision: 'Rev 1.0', parentSop: 'SOP-WH-002',  status: 'active', source: 'system-rendered'                     },
  { formatNo: 'F-WH-03-CYCLECOUNT',              title: 'Cycle Count Variance Sheet',           revision: 'Rev 1.0', parentSop: 'SOP-WH-003',  status: 'active', source: '/d/stock'                            },
  { formatNo: 'F-WH-04-STOCK-ADJUSTMENT',        title: 'Stock Adjustment Form',                revision: 'Rev 1.0', parentSop: 'SOP-PRO-001', status: 'active', source: '/d/stock/[id]'                       },
  { formatNo: 'F-HR-01-EMPLOYEE-ONBOARD',        title: 'Employee Onboarding Checklist',        revision: 'Rev 1.0', parentSop: 'SOP-HR-001',  status: 'active', source: '/d/employees/add'                    },
  { formatNo: 'F-HR-02-LEAVE-APP',               title: 'Leave Application Form',               revision: 'Rev 1.0', parentSop: 'SOP-HR-002',  status: 'active', source: '/d/leave'                            },
  { formatNo: 'F-HR-03-PAYSLIP',                 title: 'Payslip Format',                       revision: 'Rev 1.0', parentSop: 'SOP-HR-003',  status: 'active', source: '/d/payroll/[runId]/[employeeId]/payslip' },
  { formatNo: 'F-HR-04-EXIT',                    title: 'Employee Exit / Clearance Form',       revision: 'Rev 1.0', parentSop: 'SOP-HR-004',  status: 'active', source: '/d/employees/[id]'                   },
  { formatNo: 'F-ATS-01-JOB-POSTING',            title: 'Job Posting Template',                 revision: 'Rev 1.0', parentSop: 'SOP-ATS-001', status: 'active', source: '/d/jobs/new'                         },
  { formatNo: 'F-ATS-02-APPLICATION',            title: 'Job Application Form',                 revision: 'Rev 1.0', parentSop: 'SOP-ATS-002', status: 'active', source: '/careers + /api/ats/apply'           },
  { formatNo: 'F-OPS-01-CONTRACT',               title: 'Operations Contract Template',         revision: 'Rev 1.0', parentSop: 'SOP-OPS-001', status: 'active', source: '/d/operations/new'                   },
  { formatNo: 'F-OPS-02-LAB-PARAMETER',          title: 'Lab Parameter Configuration Sheet',    revision: 'Rev 1.0', parentSop: 'SOP-OPS-002', status: 'active', source: '/d/operations/lab'                   },
  { formatNo: 'F-OPS-03-COA',                    title: 'Certificate of Analysis (COA)',        revision: 'Rev 1.0', parentSop: 'SOP-OPS-002', status: 'active', source: 'system-rendered'                     },
  { formatNo: 'F-RND-01-TRIAL-CHARTER',          title: 'Pilot Trial Charter',                  revision: 'Rev 1.0', parentSop: 'SOP-RND-001', status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-RND-02-METHOD-VALIDATION',      title: 'Method Validation Report',             revision: 'Rev 1.0', parentSop: 'SOP-RND-002', status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-ECO-01-PICKUP-REQUEST',         title: 'E-waste Pickup Request Form',          revision: 'Rev 1.0', parentSop: 'SOP-ECO-001', status: 'active', source: '/recycling'                          },
  { formatNo: 'F-ECO-04-RECYCLING-CERT',         title: 'Certificate of Recycling',             revision: 'Rev 1.0', parentSop: 'SOP-ECO-004', status: 'active', source: 'system-rendered'                     },
  { formatNo: 'F-ENG-01-DRAWING-REGISTER',       title: 'Drawing Register / Title Block',       revision: 'Rev 1.0', parentSop: 'SOP-ENG-001', status: 'active', source: '/d/projects/[id]'                    },
  { formatNo: 'F-ENG-02-PROJECT-CHARTER',        title: 'EPC Project Charter',                  revision: 'Rev 1.0', parentSop: 'SOP-ENG-002', status: 'active', source: '/d/projects/new'                     },
  { formatNo: 'F-ENG-03-FAB-ROUTING',            title: 'Fabrication Routing Card',             revision: 'Rev 1.0', parentSop: 'SOP-ENG-003', status: 'active', source: '/d/projects/[id]'                    },
  { formatNo: 'F-LEG-01-CONTRACT-REQUEST',       title: 'Contract Drafting Request',            revision: 'Rev 1.0', parentSop: 'SOP-LEG-001', status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-LEG-02-COMPLIANCE-CALENDAR',    title: 'Statutory Compliance Calendar',        revision: 'Rev 1.0', parentSop: 'SOP-LEG-002', status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-SW-01-RELEASE-NOTES',           title: 'Software Release Notes Template',      revision: 'Rev 1.0', parentSop: 'SOP-SW-001',  status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-QMS-01-NCR',                    title: 'Non-Conformance Report (NCR)',         revision: 'Rev 1.0', parentSop: 'SOP-QMS-001', status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-QMS-02-INTERNAL-AUDIT',         title: 'Internal Audit Checklist',             revision: 'Rev 1.0', parentSop: 'SOP-QMS-001', status: 'active', source: '/d/documents'                        },
  { formatNo: 'F-IT-01-ACCESS-REVIEW',           title: 'User Access Review Form',              revision: 'Rev 1.0', parentSop: 'SOP-IT-002',  status: 'active', source: '/d/admin/users'                      },
];
