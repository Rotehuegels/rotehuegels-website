// ── IMS Standard Operating Procedures ────────────────────────────────────────
// Comprehensive SOPs for all Rotehügels ERP functions
// Aligned with ISO 9001:2015 clause 8.1 — Operational planning and control

export type SOPStep = {
  step: number;
  action: string;
  detail: string;
  system?: string;        // ERP path / module reference
};

export type SOP = {
  id: string;
  title: string;
  department: string;
  category: string;
  version: string;
  effectiveDate: string;
  reviewDate: string;
  approvedBy: string;
  purpose: string;
  scope: string;
  responsibilities: string[];
  procedure: SOPStep[];
  relatedDocs: string[];
  kpis?: string[];
};

// ── ACCOUNTS / FINANCE ───────────────────────────────────────────────────────

const ACC_001: SOP = {
  id: 'SOP-ACC-001',
  title: 'Customer Creation & Management',
  department: 'Accounts',
  category: 'Sales & Receivables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To establish a standardized process for creating, maintaining, and managing customer master records in the ERP system, ensuring accurate and complete data for billing, GST compliance, and relationship management.',
  scope: 'Applies to all new customer registrations, updates to existing customer records, and customer deactivation across all business units.',
  responsibilities: [
    'Sales Team: Initiates customer creation requests with verified details',
    'Accounts Team: Validates GST registration, banking details, and creates the record',
    'Management: Approves customer credit terms and special pricing',
  ],
  procedure: [
    { step: 1, action: 'Receive Customer Request', detail: 'Obtain customer details from the sales team or via the external Customer Registration Portal. Verify completeness of: company name, GSTIN, PAN, contact person, email, phone, billing address, and shipping address.', system: 'Portal → /customers/register' },
    { step: 2, action: 'Verify GST Registration', detail: 'Cross-check the GSTIN on the GST portal (https://services.gst.gov.in). Confirm the trade name, registration status (Active), and state code match the provided details.', system: 'External GST Portal' },
    { step: 3, action: 'Check for Duplicates', detail: 'Search existing customers by GSTIN, company name, and email in the ERP to prevent duplicate entries.', system: 'Dashboard → Sales → Customers' },
    { step: 4, action: 'Create Customer Record', detail: 'Navigate to Sales → Customers. Click "Add Customer". Fill in all mandatory fields: Company Name, GSTIN, Contact Person, Email, Phone, State, Billing Address, Shipping Address. Set initial credit terms if applicable.', system: '/d/customers → Add' },
    { step: 5, action: 'Assign Customer Code', detail: 'System auto-generates a unique customer code. Note this code for future reference and communicate it to the sales team.', system: 'Auto-generated' },
    { step: 6, action: 'Verify & Save', detail: 'Review all entered data for accuracy. Save the record. System logs the creation in the Audit Trail automatically.', system: '/d/audit' },
    { step: 7, action: 'Communicate to Stakeholders', detail: 'Notify the sales team and relevant department heads of the new customer creation via email or internal communication.', system: 'Dashboard → IT → Mail' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'SOP-SAL-002 (Customer Registration & Approval)', 'GST Registration Verification Checklist'],
  kpis: ['Customer creation turnaround: < 24 hours', 'Data accuracy rate: > 99%', 'Duplicate rate: < 1%'],
};

const ACC_002: SOP = {
  id: 'SOP-ACC-002',
  title: 'Supplier Creation & Management',
  department: 'Accounts',
  category: 'Procurement & Payables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To define the process for onboarding and managing supplier records, ensuring compliance with procurement policies and GST regulations.',
  scope: 'Covers all new supplier onboarding, record updates, and supplier performance monitoring.',
  responsibilities: [
    'Procurement Team: Identifies and vets potential suppliers',
    'Accounts Team: Creates supplier records and validates tax compliance',
    'Management: Approves new supplier partnerships and payment terms',
  ],
  procedure: [
    { step: 1, action: 'Receive Supplier Registration', detail: 'Obtain supplier details via the Supplier Registration Portal or procurement team request. Required details: Company name, GSTIN, PAN, contact person, bank details, product/service categories.', system: 'Portal → /suppliers/register' },
    { step: 2, action: 'Verify Supplier Credentials', detail: 'Validate GSTIN on the GST portal. Verify PAN through the Income Tax portal. Check for any blacklisting or adverse reports.', system: 'External Portals' },
    { step: 3, action: 'Due Diligence Check', detail: 'Review supplier capabilities, past performance (if available), certifications (ISO, industry-specific), and financial stability.', system: 'Network → Supplier Registrations' },
    { step: 4, action: 'Create Supplier Record', detail: 'Navigate to Procurement → Suppliers. Click "Add Supplier". Enter all mandatory fields including vendor code, GST details, payment terms, and bank account information.', system: '/d/suppliers → Add' },
    { step: 5, action: 'Set Payment Terms', detail: 'Configure default payment terms (Net 30/60/90), preferred payment method, and TDS applicability based on supplier category.', system: '/d/suppliers' },
    { step: 6, action: 'Approval & Activation', detail: 'Submit for management approval. Once approved, activate the supplier record for use in Purchase Orders.', system: '/d/supplier-reg' },
    { step: 7, action: 'Communicate Supplier Code', detail: 'Share the assigned supplier code with the procurement team and update the approved vendor list.', system: 'Internal Communication' },
  ],
  relatedDocs: ['SOP-ACC-004 (Purchase Order Processing)', 'SOP-NET-002 (Partner Registration)', 'Approved Vendor List'],
  kpis: ['Supplier onboarding time: < 48 hours', 'GST compliance rate: 100%', 'Vendor qualification completion: 100%'],
};

const ACC_003: SOP = {
  id: 'SOP-ACC-003',
  title: 'Sales Order Processing',
  department: 'Accounts',
  category: 'Sales & Receivables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To standardize the end-to-end sales order lifecycle from creation through fulfillment and payment tracking, ensuring accurate revenue recognition and GST compliance.',
  scope: 'Applies to all sales orders for goods and services across all business verticals.',
  responsibilities: [
    'Sales Team: Creates orders based on confirmed quotations or direct customer requests',
    'Operations Team: Fulfills goods/service delivery against the order',
    'Accounts Team: Manages invoicing, payment tracking, and GST compliance',
    'Management: Approves orders exceeding defined thresholds',
  ],
  procedure: [
    { step: 1, action: 'Initiate Order', detail: 'Navigate to Sales → Orders → New Order. Select the customer from the master list. Choose order type: Goods or Services.', system: '/d/orders → New' },
    { step: 2, action: 'Add Line Items', detail: 'Add items/services from the catalog. For each line item, specify: description, HSN/SAC code, quantity, unit rate, and applicable GST rate (5%, 12%, 18%, 28%). System auto-calculates CGST/SGST/IGST based on customer state.', system: '/d/orders/new' },
    { step: 3, action: 'Apply Commercial Terms', detail: 'Set payment terms, delivery schedule, and any special conditions. Apply discounts if authorized. Add any applicable adjustments (TDS, advance payments).', system: 'Order Form' },
    { step: 4, action: 'Review & Confirm', detail: 'Review the complete order summary including: total value, tax breakup, payment terms. Verify HSN codes match the item catalog. Save as Draft for review or mark as Active.', system: '/d/orders' },
    { step: 5, action: 'Generate Invoice', detail: 'Once the order is active, generate the tax invoice. Ensure invoice number follows the sequential numbering scheme. Download/email the invoice to the customer.', system: 'Order Detail → Print/Email' },
    { step: 6, action: 'Track Payments', detail: 'Record payment receipts as they are received. Track: amount received, TDS deducted by customer, payment date, mode of payment, and reference number.', system: '/d/orders/[id] → Payments' },
    { step: 7, action: 'Reconcile & Close', detail: 'When all payments are received (net of TDS), mark the order as Completed. Verify the Customer Ledger reflects accurate outstanding.', system: '/d/customer-ledger' },
    { step: 8, action: 'GST Reporting', detail: 'Ensure the order appears correctly in GSTR-1 (outward supplies). Verify HSN summary and tax amounts match the filed returns.', system: '/d/gst/filing' },
  ],
  relatedDocs: ['SOP-ACC-005 (Quotation Management)', 'SOP-ACC-006 (Invoice & Payment Processing)', 'SOP-ACC-008 (GST Filing)', 'Order Terms & Conditions Template'],
  kpis: ['Order processing time: < 4 hours', 'Invoice accuracy: > 99.5%', 'Payment collection within terms: > 85%'],
};

const ACC_004: SOP = {
  id: 'SOP-ACC-004',
  title: 'Purchase Order Processing',
  department: 'Accounts',
  category: 'Procurement & Payables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To establish a controlled process for creating and managing purchase orders, ensuring proper authorization, cost control, and supplier accountability.',
  scope: 'Covers all procurement of goods and services including direct purchases, sub-contracting, and re-invoicing scenarios.',
  responsibilities: [
    'Procurement Team: Raises PO requests based on project needs or stock replenishment',
    'Accounts Team: Verifies budget availability and processes PO payments',
    'Management: Approves POs above defined monetary thresholds',
    'Operations Team: Confirms receipt of goods/services against PO',
  ],
  procedure: [
    { step: 1, action: 'Identify Procurement Need', detail: 'Determine the requirement based on project demand, stock reorder levels, or operational need. Check existing stock levels before raising a new PO.', system: '/d/stock' },
    { step: 2, action: 'Select Supplier', detail: 'Choose from the approved vendor list. For new suppliers, initiate the Supplier Registration process (SOP-ACC-002) first. Compare quotations if value exceeds threshold.', system: '/d/suppliers' },
    { step: 3, action: 'Create Purchase Order', detail: 'Navigate to Procurement → Purchase Orders → New. Select supplier, add line items with specifications, quantities, agreed rates, HSN codes, and delivery timeline.', system: '/d/purchase-orders → New' },
    { step: 4, action: 'Apply Terms & Conditions', detail: 'Set payment terms (advance %, milestone-based, on delivery). Include quality requirements, warranty terms, and penalty clauses as applicable.', system: 'PO Form' },
    { step: 5, action: 'Obtain Approval', detail: 'Submit PO for management approval. POs above the defined threshold require additional authorization. System routes for approval automatically.', system: '/d/purchase-orders' },
    { step: 6, action: 'Issue PO to Supplier', detail: 'Once approved, share the PO with the supplier via email. Obtain written acceptance/acknowledgment from the supplier.', system: 'Email / Portal' },
    { step: 7, action: 'Track Delivery', detail: 'Monitor delivery timelines. Record shipment details in the Shipments module as goods are dispatched/received. Update PO status accordingly.', system: '/d/shipments' },
    { step: 8, action: 'Process Payment', detail: 'Upon satisfactory receipt, process payment as per agreed terms. Record payment details, deduct TDS where applicable, and update the Creditors Ledger.', system: '/d/creditors-ledger' },
    { step: 9, action: 'Re-Invoice (if applicable)', detail: 'For expenses incurred on behalf of clients, use the Re-Invoice module to pass through costs with appropriate markup.', system: '/d/reinvoice' },
  ],
  relatedDocs: ['SOP-ACC-002 (Supplier Management)', 'SOP-PRO-002 (Shipment Tracking)', 'SOP-PRO-003 (Re-Invoice Processing)', 'Purchase Authorization Matrix'],
  kpis: ['PO processing time: < 24 hours', 'On-time delivery rate: > 90%', 'Cost variance against budget: < 5%'],
};

const ACC_005: SOP = {
  id: 'SOP-ACC-005',
  title: 'Quotation Management',
  department: 'Accounts',
  category: 'Sales & Receivables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To define the process for creating, tracking, and converting sales quotations, ensuring competitive pricing and timely follow-up.',
  scope: 'Applies to all quotations issued to prospective and existing customers.',
  responsibilities: [
    'Sales Team: Prepares quotations based on customer requirements and pricing guidelines',
    'Technical Team: Provides cost estimates for services and custom work',
    'Management: Approves pricing for non-standard quotations',
  ],
  procedure: [
    { step: 1, action: 'Receive Enquiry', detail: 'Log the customer enquiry with details: required items/services, quantities, specifications, delivery expectations, and any special requirements.', system: 'Sales → Customers / Email' },
    { step: 2, action: 'Prepare Cost Estimate', detail: 'Calculate costs including: material/service costs, overheads, margins, and applicable taxes. Obtain technical inputs for custom or specialized requirements.', system: 'Internal Costing' },
    { step: 3, action: 'Create Quotation', detail: 'Navigate to Sales → Quotes → New. Select customer, add line items with descriptions, HSN/SAC codes, quantities, rates, and GST rates. Include validity period and payment terms.', system: '/d/quotes → New' },
    { step: 4, action: 'Review & Approve Pricing', detail: 'For standard items, follow the approved price list. For custom pricing, obtain management approval before issuing the quotation.', system: '/d/quotes' },
    { step: 5, action: 'Issue Quotation', detail: 'Generate the quotation document. Email it to the customer with a covering note. Set status to "Sent".', system: '/d/quotes → Email' },
    { step: 6, action: 'Follow-up & Negotiate', detail: 'Track quotation status. Follow up with the customer within the validity period. Handle negotiations by creating revised versions while maintaining history.', system: '/d/quotes' },
    { step: 7, action: 'Convert to Order', detail: 'Upon customer acceptance, convert the quotation to a Sales Order using the "Convert to Order" function. This pre-fills all line items and customer details.', system: '/d/quotes/[id] → Convert' },
    { step: 8, action: 'Close Rejected Quotes', detail: 'For rejected quotations, update status to "Rejected" with the reason. Analyze rejection patterns for pricing strategy improvement.', system: '/d/quotes' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'Standard Price List', 'Quotation Terms & Conditions Template'],
  kpis: ['Quotation turnaround: < 24 hours', 'Conversion rate: > 30%', 'Average response time: < 48 hours'],
};

const ACC_006: SOP = {
  id: 'SOP-ACC-006',
  title: 'Invoice & Payment Processing',
  department: 'Accounts',
  category: 'Sales & Receivables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To establish procedures for generating accurate invoices, recording payments, and maintaining clean receivable records.',
  scope: 'Covers all outward invoicing, payment receipt processing, TDS reconciliation, and customer ledger management.',
  responsibilities: [
    'Accounts Team: Generates invoices, records payments, and reconciles ledgers',
    'Sales Team: Follows up on overdue payments',
    'Management: Reviews aging reports and approves write-offs',
  ],
  procedure: [
    { step: 1, action: 'Generate Invoice', detail: 'From an active Sales Order, generate the tax invoice. Verify: sequential invoice number, correct customer GSTIN, HSN codes, tax calculations (CGST+SGST for intra-state, IGST for inter-state), and total amount.', system: '/d/orders/[id]' },
    { step: 2, action: 'Issue Invoice to Customer', detail: 'Email the invoice to the customer or share via the Client Portal. Maintain a copy in the Document Registry for compliance.', system: 'Email / Portal' },
    { step: 3, action: 'Record Payment Receipt', detail: 'When payment is received, navigate to Finance → Payment Receipts → New. Enter: customer, amount received, payment date, mode (NEFT/RTGS/UPI/cheque), bank reference, and linked order.', system: '/d/receipts → New' },
    { step: 4, action: 'Handle TDS Deductions', detail: 'If the customer deducts TDS, record the TDS amount separately. Verify TDS rate matches the applicable section (194C/194J/194H). Obtain TDS certificate (Form 16A) quarterly.', system: '/d/orders/[id] → Payments' },
    { step: 5, action: 'Update Customer Ledger', detail: 'Verify the Customer Ledger reflects: invoice raised, payment received, TDS deducted, and net outstanding. Reconcile monthly with the customer.', system: '/d/customer-ledger' },
    { step: 6, action: 'Follow-up on Overdue', detail: 'Review the aging report. Send payment reminders at 30, 60, and 90 days. Escalate to management for amounts overdue beyond 90 days.', system: '/d/customer-ledger' },
    { step: 7, action: 'Cash Book Entry', detail: 'Ensure all payment receipts are reflected in the Cash Book. Reconcile with bank statements periodically.', system: '/d/cash-book' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'SOP-ACC-009 (Bank Reconciliation)', 'TDS Rate Chart'],
  kpis: ['Invoice generation: same day as dispatch', 'Payment recording: within 24 hours of receipt', 'Overdue follow-up compliance: 100%'],
};

const ACC_007: SOP = {
  id: 'SOP-ACC-007',
  title: 'Expense Management',
  department: 'Accounts',
  category: 'Cost Control',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To control and track all business expenses with proper authorization, categorization, and documentation for accurate financial reporting.',
  scope: 'Covers all operational expenses including project costs, overheads, travel, and miscellaneous expenditure.',
  responsibilities: [
    'All Employees: Submit expense claims with supporting documents',
    'Accounts Team: Verifies, categorizes, and records expenses',
    'Management: Approves expenses above defined limits',
  ],
  procedure: [
    { step: 1, action: 'Incur & Document Expense', detail: 'Collect original bills/receipts/invoices for all expenses. Ensure GST invoices are obtained where applicable for Input Tax Credit claims.', system: 'Physical Documentation' },
    { step: 2, action: 'Submit Expense Entry', detail: 'Navigate to Finance → Expenses → New. Enter: expense date, category, description, amount, GST details (if applicable), payment mode, and attach scanned receipts.', system: '/d/expenses → New' },
    { step: 3, action: 'Categorize Expense', detail: 'Assign the correct expense category: Travel, Office Supplies, Professional Fees, Utilities, Rent, Equipment, Marketing, etc. Link to the relevant project or cost center if applicable.', system: '/d/expenses' },
    { step: 4, action: 'Approval Workflow', detail: 'Expenses above the self-approval limit are routed to the reporting manager / management for approval. Rejected expenses are returned with comments.', system: 'Internal Approval' },
    { step: 5, action: 'Process Reimbursement', detail: 'For employee reimbursements, process payment within the next payroll cycle or as an immediate transfer. Record the payment in the Cash Book.', system: '/d/cash-book' },
    { step: 6, action: 'GST Input Credit', detail: 'For eligible expenses with valid GST invoices, ensure the input tax credit is captured in the GST filing. Verify supplier GSTIN is active.', system: '/d/gst' },
    { step: 7, action: 'P&L Impact', detail: 'Verify expenses flow correctly into the P&L Statement under the appropriate heads. Review monthly expense reports for budget variance analysis.', system: '/d/pl' },
  ],
  relatedDocs: ['SOP-ACC-008 (GST Filing)', 'SOP-ACC-010 (P&L Statement)', 'Expense Authorization Matrix', 'Travel Policy'],
  kpis: ['Expense submission turnaround: < 7 days from incurrence', 'Reimbursement processing: < 5 business days', 'ITC capture rate: > 95%'],
};

const ACC_008: SOP = {
  id: 'SOP-ACC-008',
  title: 'GST Filing & Compliance',
  department: 'Accounts',
  category: 'Tax & Compliance',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To ensure timely and accurate filing of all GST returns (GSTR-1, GSTR-3B) in compliance with the Goods & Services Tax Act, 2017.',
  scope: 'Covers preparation, review, and filing of monthly/quarterly GST returns, HSN summary, and input tax credit reconciliation.',
  responsibilities: [
    'Accounts Team: Prepares GST data, reconciles input/output tax, and drafts returns',
    'Management: Reviews and authorizes GST filings',
    'External CA (if applicable): Validates complex transactions and filing accuracy',
  ],
  procedure: [
    { step: 1, action: 'Compile Sales Data (GSTR-1)', detail: 'Navigate to Finance → GST Report. System auto-generates the outward supply summary from Sales Orders and Invoices. Verify: B2B invoices (with GSTIN), B2C invoices, HSN-wise summary, and tax rates.', system: '/d/gst' },
    { step: 2, action: 'Compile Purchase Data', detail: 'Review all purchase invoices and expense entries with GST. Verify supplier GSTINs are active. Reconcile input tax credit claims with GSTR-2A/2B auto-populated data.', system: '/d/gst' },
    { step: 3, action: 'Reconcile Tax Amounts', detail: 'Cross-check: Output tax (CGST + SGST + IGST) from sales vs. Input tax credit from purchases. Calculate net tax payable or credit carry-forward.', system: '/d/gst' },
    { step: 4, action: 'Prepare GSTR-1', detail: 'Navigate to GST Filing. Review the system-generated GSTR-1 data. Verify invoice-wise details, amendments to prior period invoices, and debit/credit notes.', system: '/d/gst/filing' },
    { step: 5, action: 'Prepare GSTR-3B', detail: 'From the GST Filing page, review the GSTR-3B summary. Verify: total outward supplies, exempt/nil-rated supplies, input tax credit summary, and net tax payable.', system: '/d/gst/filing' },
    { step: 6, action: 'Management Review', detail: 'Present the GST summary to management for review and approval before filing. Flag any discrepancies or unusual transactions.', system: 'Internal Review' },
    { step: 7, action: 'File Returns on GST Portal', detail: 'File GSTR-1 by the 11th of the following month. File GSTR-3B by the 20th. Make tax payment via electronic credit/cash ledger. Record filing confirmation.', system: 'GST Portal' },
    { step: 8, action: 'Archive & Document', detail: 'Save filed returns, acknowledgment receipts, and payment challans in the Document Registry for audit purposes.', system: '/d/documents' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'SOP-ACC-011 (E-Way Bill)', 'GST Rate Master', 'HSN Code Directory'],
  kpis: ['GSTR-1 filing: by 11th of following month', 'GSTR-3B filing: by 20th of following month', 'ITC reconciliation accuracy: > 99%', 'Zero penalties for late filing'],
};

const ACC_009: SOP = {
  id: 'SOP-ACC-009',
  title: 'Bank Reconciliation',
  department: 'Accounts',
  category: 'Financial Control',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To reconcile bank statements with ERP records, ensuring all financial transactions are accurately captured and any discrepancies are identified and resolved promptly.',
  scope: 'Covers all bank accounts used for business operations, including current accounts, savings accounts, and fixed deposit accounts.',
  responsibilities: [
    'Accounts Team: Performs monthly bank reconciliation',
    'Management: Reviews reconciliation reports and approves adjustments',
  ],
  procedure: [
    { step: 1, action: 'Download Bank Statement', detail: 'Obtain the bank statement for the reconciliation period (monthly). Download in digital format (CSV/PDF) from the banking portal.', system: 'Bank Portal' },
    { step: 2, action: 'Import into ERP', detail: 'Navigate to Finance → Bank Statement. Import the downloaded statement. System parses and displays individual transactions.', system: '/d/bank' },
    { step: 3, action: 'Auto-Match Transactions', detail: 'Use the system\'s matching feature to automatically link bank transactions with recorded payments, receipts, and expense entries based on amount, date, and reference.', system: '/d/bank' },
    { step: 4, action: 'Manual Matching', detail: 'For unmatched transactions, manually identify and link them to the corresponding ERP entries. Investigate unknown credits/debits.', system: '/d/bank' },
    { step: 5, action: 'Record Adjustments', detail: 'For bank charges, interest credits, and other items not yet in the ERP, create corresponding expense or income entries. Record in the Cash Book.', system: '/d/cash-book' },
    { step: 6, action: 'Prepare Reconciliation Report', detail: 'Generate the reconciliation statement showing: bank balance per statement, add/deduct unreconciled items, balance per ERP. Flag any discrepancies exceeding tolerance limits.', system: '/d/bank' },
    { step: 7, action: 'Review & Sign-off', detail: 'Submit the reconciliation report to management for review. Maintain signed copies for audit records.', system: 'Internal Approval' },
  ],
  relatedDocs: ['SOP-ACC-006 (Invoice & Payment Processing)', 'SOP-ACC-007 (Expense Management)', 'Bank Reconciliation Template'],
  kpis: ['Reconciliation completion: by 5th of following month', 'Unreconciled items: < 5', 'Discrepancy resolution: within 48 hours'],
};

const ACC_010: SOP = {
  id: 'SOP-ACC-010',
  title: 'P&L Statement Generation',
  department: 'Accounts',
  category: 'Financial Reporting',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To generate accurate Profit & Loss statements for financial analysis, decision-making, and statutory compliance.',
  scope: 'Covers monthly, quarterly, and annual P&L statement generation for all fiscal years.',
  responsibilities: [
    'Accounts Team: Ensures all revenue and expenses are recorded before generating P&L',
    'Management: Reviews P&L for business performance assessment',
  ],
  procedure: [
    { step: 1, action: 'Pre-Generation Checklist', detail: 'Before generating the P&L, ensure: all invoices are raised, all expenses are recorded, bank reconciliation is complete, and all adjustments (depreciation, provisions) are posted.', system: 'Cross-module verification' },
    { step: 2, action: 'Select Fiscal Year & Period', detail: 'Navigate to Finance → P&L Statement. Select the appropriate fiscal year (e.g., FY 2025-26, April to March). Choose the period: monthly, quarterly, or annual.', system: '/d/pl' },
    { step: 3, action: 'Generate Statement', detail: 'System auto-calculates: Revenue (from orders), Cost of Goods Sold, Gross Profit, Operating Expenses (categorized), Operating Profit, Other Income/Expenses, and Net Profit.', system: '/d/pl' },
    { step: 4, action: 'Review Line Items', detail: 'Verify each category: revenue matches order totals, expenses are correctly classified, no duplicates exist, and inter-company transactions are eliminated if applicable.', system: '/d/pl' },
    { step: 5, action: 'Export & Archive', detail: 'Export the P&L statement to CSV/PDF. Save in the Document Registry under Financial Reports category.', system: '/d/pl → Export' },
    { step: 6, action: 'Management Presentation', detail: 'Present the P&L to management with variance analysis (actual vs. budget, period-over-period comparison). Highlight key trends and areas of concern.', system: 'Management Review' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'SOP-ACC-007 (Expense Management)', 'SOP-ACC-009 (Bank Reconciliation)', 'Chart of Accounts'],
  kpis: ['Monthly P&L generation: by 10th of following month', 'Variance from budget: reported monthly', 'Statement accuracy: zero material misstatements'],
};

const ACC_011: SOP = {
  id: 'SOP-ACC-011',
  title: 'E-Way Bill Management',
  department: 'Accounts',
  category: 'Tax & Compliance',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To ensure compliance with E-Way Bill regulations for the movement of goods exceeding INR 50,000 in value.',
  scope: 'Covers generation, management, and cancellation of E-Way Bills for all outward and inward movement of goods.',
  responsibilities: [
    'Accounts Team: Generates E-Way Bills before goods dispatch',
    'Logistics/Operations: Ensures transporter carries valid E-Way Bill during transit',
    'Management: Monitors compliance and reviews exceptions',
  ],
  procedure: [
    { step: 1, action: 'Determine E-Way Bill Requirement', detail: 'Check if the consignment value exceeds INR 50,000 (including tax). E-Way Bill is mandatory for inter-state movement regardless of value for certain goods.', system: 'Order/Invoice Review' },
    { step: 2, action: 'Prepare E-Way Bill Data', detail: 'Collect: supplier/recipient GSTIN, invoice number, invoice date, item details (HSN, quantity, value), transporter details, vehicle number, and distance.', system: '/d/orders/[id]' },
    { step: 3, action: 'Generate E-Way Bill', detail: 'Navigate to Finance → E-Way Bills → New. Enter all required details. System validates the data and assigns the E-Way Bill number upon successful generation.', system: '/d/eway-bills → New' },
    { step: 4, action: 'Share with Transporter', detail: 'Provide the E-Way Bill number and printed copy to the transporter. Ensure it accompanies the goods during transit.', system: '/d/eway-bills' },
    { step: 5, action: 'Track Validity', detail: 'Monitor E-Way Bill validity based on distance (1 day per 200 km for regular, 1 day per 20 km for over-dimensional cargo). Extend if required before expiry.', system: '/d/eway-bills' },
    { step: 6, action: 'Cancel if Required', detail: 'If goods are not transported or details change, cancel the E-Way Bill within 24 hours of generation on the EWB portal.', system: 'EWB Portal' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'SOP-ACC-008 (GST Filing)', 'E-Way Bill Rules & Exemptions'],
  kpis: ['E-Way Bill generation: before goods dispatch', 'Compliance rate: 100%', 'Cancellation within 24 hours: 100% when required'],
};

const ACC_012: SOP = {
  id: 'SOP-ACC-012',
  title: 'Credit & Debit Note Processing',
  department: 'Accounts',
  category: 'Sales & Receivables',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To document the procedure for issuing credit notes (for returns, discounts, corrections) and debit notes (for additional charges, price increases) in compliance with GST regulations.',
  scope: 'Covers all credit and debit notes issued to customers and received from suppliers.',
  responsibilities: [
    'Accounts Team: Prepares and issues credit/debit notes',
    'Sales/Procurement Team: Initiates requests with justification',
    'Management: Approves notes above defined thresholds',
  ],
  procedure: [
    { step: 1, action: 'Identify Need', detail: 'Determine the reason for the credit/debit note: goods returned, pricing error, quality rejection, additional charges, or rate revision. Obtain supporting documentation.', system: 'Sales/Procurement Team Request' },
    { step: 2, action: 'Verify Original Transaction', detail: 'Locate the original invoice/order in the system. Confirm the amounts, tax rates, and customer/supplier details.', system: '/d/orders or /d/purchase-orders' },
    { step: 3, action: 'Create Credit/Debit Note', detail: 'Navigate to Finance → Credit/Debit Notes → New. Select the type (Credit or Debit), link to the original invoice, specify the adjustment amount, GST impact, and reason.', system: '/d/credit-notes → New' },
    { step: 4, action: 'GST Adjustment', detail: 'System auto-calculates the GST impact: Credit Note reduces output tax liability; Debit Note increases it. Verify the tax adjustment is correct.', system: '/d/credit-notes' },
    { step: 5, action: 'Issue & Communicate', detail: 'Generate the credit/debit note document. Share with the customer/supplier. Update the respective ledger (Customer Ledger or Creditors Ledger).', system: '/d/customer-ledger or /d/creditors-ledger' },
    { step: 6, action: 'GST Return Reporting', detail: 'Ensure credit/debit notes are reported in the next GSTR-1 filing under the appropriate section (B2B Amendments / Credit-Debit Notes).', system: '/d/gst/filing' },
  ],
  relatedDocs: ['SOP-ACC-003 (Sales Order Processing)', 'SOP-ACC-008 (GST Filing)', 'Credit Note Authorization Form'],
  kpis: ['Credit/Debit note issuance: within 48 hours of request', 'GST reporting accuracy: 100%', 'Ledger update: same day as issuance'],
};

// ── HR / PEOPLE ──────────────────────────────────────────────────────────────

const HR_001: SOP = {
  id: 'SOP-HR-001',
  title: 'Employee Onboarding',
  department: 'Human Resources',
  category: 'Talent Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To establish a standardized onboarding process for new employees, ensuring smooth integration, compliance with employment laws (Tamil Nadu jurisdiction), and system access provisioning.',
  scope: 'Applies to all new hires including full-time employees, REX Network members, board members, part-time, consultants, contractors, and interns.',
  responsibilities: [
    'HR Team: Manages the end-to-end onboarding process',
    'IT Team: Provisions system access and email accounts',
    'Reporting Manager: Assigns initial tasks and introduces team',
    'Accounts Team: Sets up payroll and salary structure',
  ],
  procedure: [
    { step: 1, action: 'Pre-Joining Preparation', detail: 'Before the joining date: prepare offer letter, collect signed acceptance, initiate background verification, and prepare the workstation/equipment.', system: 'ATS → Hired Status' },
    { step: 2, action: 'Document Collection', detail: 'Collect: Aadhaar card, PAN card, passport-size photos, educational certificates, experience letters, bank account details (for salary), and Form 11 (PF nomination).', system: 'Physical/Scanned Copies' },
    { step: 3, action: 'Create Employee Record', detail: 'Navigate to People → Add Employee. Fill in: Full Name, Role/Designation, Department, Employment Type (Full-time/REX Network/Board Member), Sub-type (if applicable), Join Date, and reporting hierarchy.', system: '/d/employees/add' },
    { step: 4, action: 'Set Employment Type', detail: 'Select the appropriate type: Full-time (regular employee), REX Network (linked to REX member profile), Board Member (governance role). For non-permanent roles, select sub-type: Part-time, Consultant, Contract, or Intern.', system: '/d/employees/add' },
    { step: 5, action: 'Configure Salary Structure', detail: 'Navigate to People → Payroll → Salary Setup. Configure the employee\'s compensation: basic salary, HRA, special allowance, PF contribution, professional tax (Tamil Nadu rates), and any other deductions/allowances.', system: '/d/payroll/setup' },
    { step: 6, action: 'Set Leave Balances', detail: 'Initialize leave balances based on company policy and pro-rata calculation for mid-year joiners. Configure leave types: Earned Leave, Casual Leave, Sick Leave, etc.', system: '/d/leave' },
    { step: 7, action: 'Provision System Access', detail: 'Create Microsoft 365 account (for email and authentication). Grant ERP dashboard access with appropriate role-based permissions (admin/user/client).', system: 'Microsoft 365 Admin / ERP Settings' },
    { step: 8, action: 'Orientation & Handover', detail: 'Conduct orientation covering: company policies, IMS procedures, ERP usage, leave policy, payroll dates, and emergency contacts. Introduce to the team.', system: 'In-Person/Virtual' },
    { step: 9, action: 'Probation Tracking', detail: 'Set probation end date in the system. Schedule probation review meetings. Set reminders for confirmation decision.', system: '/d/employees/[id]' },
  ],
  relatedDocs: ['SOP-HR-003 (Payroll Processing)', 'SOP-HR-002 (Leave Management)', 'SOP-ATS-002 (Application Pipeline)', 'Offer Letter Template', 'Company Policies Handbook'],
  kpis: ['Onboarding completion: within 2 days of joining', 'Document collection: 100% before first payroll', 'System access provisioning: day 1'],
};

const HR_002: SOP = {
  id: 'SOP-HR-002',
  title: 'Leave Management',
  department: 'Human Resources',
  category: 'Attendance & Leave',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage employee leave applications, approvals, and balance tracking in compliance with the Shops & Establishments Act (Tamil Nadu) and company leave policy.',
  scope: 'Covers all types of leave for all employees — Earned Leave, Casual Leave, Sick Leave, Compensatory Off, and special leaves.',
  responsibilities: [
    'Employees: Apply for leave in advance through the ERP system',
    'Reporting Manager: Reviews and approves/rejects leave applications',
    'HR Team: Monitors leave balances, handles exceptions, and ensures policy compliance',
  ],
  procedure: [
    { step: 1, action: 'Check Leave Balance', detail: 'Employee navigates to People → Leave Management → Balances tab. Review available balance for the desired leave type before applying.', system: '/d/leave → Balances' },
    { step: 2, action: 'Apply for Leave', detail: 'Navigate to People → Leave Management → Apply tab. Select: Leave Type, From Date, To Date, and provide a reason. For Sick Leave beyond 2 days, attach a medical certificate.', system: '/d/leave → Apply' },
    { step: 3, action: 'Manager Review', detail: 'The reporting manager receives the leave request in the Applications tab. Review: team availability, project timelines, and leave balance. Approve or Reject with comments.', system: '/d/leave → Applications' },
    { step: 4, action: 'Notification', detail: 'System notifies the employee of the decision (Approved/Rejected). If rejected, employee can discuss with manager and reapply with modifications.', system: 'Email Notification' },
    { step: 5, action: 'Balance Deduction', detail: 'Upon approval, the system automatically deducts the leave days from the employee\'s balance. Partial days (half-day leave) are supported.', system: 'Auto-calculated' },
    { step: 6, action: 'Cancellation (if needed)', detail: 'If plans change, the employee can cancel approved leave before the leave date. Cancelled leave restores the balance automatically.', system: '/d/leave → Applications' },
    { step: 7, action: 'Leave Without Pay (LWP)', detail: 'If leave balance is exhausted, the leave is marked as LWP. LWP days are deducted from salary in the next payroll run. Requires explicit approval.', system: '/d/leave' },
    { step: 8, action: 'Year-End Processing', detail: 'At fiscal year-end: carry forward eligible Earned Leave (max as per policy), lapse Casual Leave and Sick Leave (as per policy), and reset balances for the new year.', system: '/d/leave → Balances' },
  ],
  relatedDocs: ['SOP-HR-003 (Payroll Processing)', 'Leave Policy Document', 'Tamil Nadu S&E Act Compliance Checklist'],
  kpis: ['Leave application response time: < 24 hours', 'Unauthorized absence rate: < 1%', 'Leave balance accuracy: 100%'],
};

const HR_003: SOP = {
  id: 'SOP-HR-003',
  title: 'Payroll Processing',
  department: 'Human Resources',
  category: 'Payroll & Compensation',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To ensure accurate and timely processing of monthly payroll, including salary calculations, statutory deductions (PF, ESI, PT, TDS), and disbursement.',
  scope: 'Covers monthly payroll processing for all active employees under Tamil Nadu jurisdiction, including salary computation, deductions, and payment.',
  responsibilities: [
    'HR Team: Provides attendance, leave, and employee change data',
    'Accounts Team: Processes payroll calculations and bank transfers',
    'Management: Reviews and approves payroll before disbursement',
  ],
  procedure: [
    { step: 1, action: 'Pre-Payroll Data Collection', detail: 'Before the payroll cut-off date (typically 25th of each month), collect: attendance data, approved leave records, LWP days, new joiners/exits for the month, salary revisions, and any one-time deductions/additions.', system: '/d/employees, /d/leave' },
    { step: 2, action: 'Verify Salary Structures', detail: 'Navigate to People → Payroll → Salary Setup. Verify that salary components are current for all employees: Basic, HRA, Special Allowance, Conveyance, Medical, and any variable pay.', system: '/d/payroll/setup' },
    { step: 3, action: 'Create Payroll Run', detail: 'Navigate to People → Payroll → Run Payroll. Select the month and year. System initializes the payroll run in Draft status.', system: '/d/payroll/new' },
    { step: 4, action: 'Review Individual Payslips', detail: 'For each employee in the run, verify: gross salary, LWP deductions, PF employee & employer contribution (12% each on Basic + DA), ESI (if applicable), Professional Tax (Tamil Nadu slabs), TDS (as per declared investments), and net payable.', system: '/d/payroll/[runId]' },
    { step: 5, action: 'Handle Exceptions', detail: 'Process: pro-rata salary for new joiners/exits, overtime (if applicable), bonus/incentive payments, salary advances recovery, and loan EMI deductions.', system: '/d/payroll/[runId] → Edit' },
    { step: 6, action: 'Management Approval', detail: 'Present the payroll summary to management: total gross, total deductions, total net pay, and employee count. Obtain approval to process.', system: 'Internal Approval' },
    { step: 7, action: 'Process Payroll', detail: 'Mark the payroll run as "Processed". This locks the calculations. Generate bank transfer file (NEFT/RTGS format) for salary disbursement.', system: '/d/payroll/[runId] → Process' },
    { step: 8, action: 'Disburse Salary', detail: 'Execute the bank transfer. Once confirmed, mark the payroll run as "Paid". System records the payment date.', system: '/d/payroll/[runId] → Pay' },
    { step: 9, action: 'Statutory Remittances', detail: 'Remit statutory dues by due dates: PF (15th of following month), ESI (15th of following month), Professional Tax (as per Tamil Nadu schedule), TDS (7th of following month).', system: 'Respective Portals' },
    { step: 10, action: 'Payslip Distribution', detail: 'Generate and distribute payslips to all employees via email or the ERP portal.', system: '/d/payroll' },
  ],
  relatedDocs: ['SOP-HR-001 (Employee Onboarding)', 'SOP-HR-002 (Leave Management)', 'Salary Structure Policy', 'TDS Declaration Form'],
  kpis: ['Payroll processing: by last working day of month', 'Salary credit: by 1st of following month', 'Statutory remittance: zero delays', 'Payslip distribution: within 2 days of salary credit'],
};

const HR_004: SOP = {
  id: 'SOP-HR-004',
  title: 'Employee Offboarding',
  department: 'Human Resources',
  category: 'Talent Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the employee separation process (resignation, termination, contract completion) ensuring proper handover, final settlement, and system deactivation.',
  scope: 'Applies to all employee separations regardless of type or reason.',
  responsibilities: [
    'HR Team: Manages the offboarding checklist and final settlement',
    'IT Team: Revokes system access and recovers assets',
    'Reporting Manager: Ensures knowledge transfer and handover',
    'Accounts Team: Processes full and final settlement',
  ],
  procedure: [
    { step: 1, action: 'Receive Separation Notice', detail: 'Accept resignation letter / issue termination letter / note contract end date. Record the last working day (LWD) based on notice period policy.', system: '/d/employees/[id]' },
    { step: 2, action: 'Update Employee Status', detail: 'Navigate to the employee profile. Set End Date to the last working day. Update Employment Status to the appropriate value: Terminated, Completed, or Inactive.', system: '/d/employees/[id] → Edit' },
    { step: 3, action: 'Knowledge Transfer', detail: 'Reporting manager ensures: project handover documentation, access credentials transfer, client relationship handover, and pending work status update.', system: 'Project Documentation' },
    { step: 4, action: 'Asset Recovery', detail: 'Recover all company assets: laptop, ID card, access cards, phone (if issued), and any other company property. Update the asset register.', system: 'Asset Checklist' },
    { step: 5, action: 'Revoke System Access', detail: 'Deactivate Microsoft 365 account, remove ERP access, revoke VPN access, and remove from all internal communication channels.', system: 'Microsoft 365 Admin / ERP' },
    { step: 6, action: 'Calculate Final Settlement', detail: 'Compute: salary for days worked in the last month, leave encashment (for earned leave balance), notice period recovery/payment, gratuity (if eligible — 5+ years), any pending reimbursements, and loan/advance recovery.', system: '/d/payroll' },
    { step: 7, action: 'Process F&F Payment', detail: 'Process the full and final settlement payment. Issue Form 16 (TDS certificate) and relieve letter.', system: '/d/payroll' },
    { step: 8, action: 'Exit Interview', detail: 'Conduct an exit interview to gather feedback on work experience, management, and improvement areas. Document findings for organizational improvement.', system: 'HR Records' },
  ],
  relatedDocs: ['SOP-HR-001 (Employee Onboarding)', 'SOP-HR-003 (Payroll Processing)', 'Exit Checklist', 'Relieving Letter Template'],
  kpis: ['F&F settlement: within 30 days of LWD', 'System access revocation: on LWD', 'Exit interview completion: > 90%'],
};

// ── ATS / RECRUITMENT ────────────────────────────────────────────────────────

const ATS_001: SOP = {
  id: 'SOP-ATS-001',
  title: 'Job Posting & Publishing',
  department: 'Recruitment',
  category: 'Talent Acquisition',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To standardize the process of creating, publishing, and managing job postings to attract qualified candidates efficiently.',
  scope: 'Covers all recruitment activities from manpower requisition to job posting publication across all departments.',
  responsibilities: [
    'Hiring Manager: Raises manpower requisition with job requirements',
    'HR/Recruitment Team: Creates job postings and manages publication',
    'Management: Approves headcount and budget for new positions',
  ],
  procedure: [
    { step: 1, action: 'Manpower Requisition', detail: 'Hiring manager submits a requisition with: position title, department, employment type, reporting structure, key responsibilities, qualifications, experience required, and budget range.', system: 'Internal Request' },
    { step: 2, action: 'Approval', detail: 'Management reviews and approves the requisition based on: business need, budget availability, and headcount plan. Rejected requisitions are returned with comments.', system: 'Management Approval' },
    { step: 3, action: 'Create Job Posting', detail: 'Navigate to People → Recruitment → Post a Job. Enter: Title, Department, Employment Type (Full-time/Part-time/Contract/Intern), Description (responsibilities, qualifications, benefits), and application deadline.', system: '/d/jobs/new' },
    { step: 4, action: 'Review Content', detail: 'Ensure the job description is: inclusive (no discriminatory language), accurate (reflects actual requirements), and compelling (highlights company culture and benefits).', system: '/d/jobs/new' },
    { step: 5, action: 'Publish', detail: 'Set the posting status to "Published". The job becomes visible on the careers page. Optionally share on job portals (LinkedIn, Naukri, Indeed) with the same job code for tracking.', system: '/d/jobs' },
    { step: 6, action: 'Monitor Applications', detail: 'Track incoming applications through the Applications module. Review application volume and quality. Adjust the posting if necessary (extend deadline, modify requirements).', system: '/d/applications' },
    { step: 7, action: 'Close Posting', detail: 'Once sufficient candidates are shortlisted or the position is filled, update the posting status to "Closed". Archive the posting for future reference.', system: '/d/jobs/[id] → Close' },
  ],
  relatedDocs: ['SOP-ATS-002 (Application Pipeline)', 'SOP-HR-001 (Employee Onboarding)', 'Job Description Templates', 'Manpower Requisition Form'],
  kpis: ['Job posting creation: within 48 hours of approval', 'Time to first application: < 7 days', 'Cost per hire: tracked per position'],
};

const ATS_002: SOP = {
  id: 'SOP-ATS-002',
  title: 'Application Pipeline Management',
  department: 'Recruitment',
  category: 'Talent Acquisition',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the candidate pipeline from application receipt through hiring decision, ensuring fair, consistent, and efficient evaluation.',
  scope: 'Covers all candidate applications from initial screening to final hiring decision or rejection.',
  responsibilities: [
    'HR/Recruitment Team: Screens applications and coordinates interviews',
    'Hiring Manager: Conducts technical interviews and makes hiring recommendations',
    'Management: Approves final offers and compensation packages',
  ],
  procedure: [
    { step: 1, action: 'Receive Application', detail: 'Applications arrive via the external application form or direct submission. System captures: candidate name, email, phone, qualifications, experience, resume, and the linked job posting.', system: '/d/applications' },
    { step: 2, action: 'Initial Screening', detail: 'Review each application against the minimum qualifications. Check for REX Network member flag (priority consideration). Move qualified candidates to "Shortlisted" stage; reject others with a courtesy notification.', system: '/d/applications → Update Stage' },
    { step: 3, action: 'Schedule Interview', detail: 'For shortlisted candidates, schedule interviews. Move the candidate to "Interview" stage. Coordinate with the hiring manager on interview format (phone, video, in-person) and panel.', system: '/d/applications → Update Stage' },
    { step: 4, action: 'Conduct Interviews', detail: 'Panel conducts interviews covering: technical skills, cultural fit, communication, and role-specific competencies. Document interview feedback and scores.', system: 'Interview Records' },
    { step: 5, action: 'Make Offer Decision', detail: 'Based on interview feedback, select the top candidate. Move to "Offer" stage. Prepare the compensation package within approved budget. Obtain management approval for the offer.', system: '/d/applications → Update Stage' },
    { step: 6, action: 'Extend Offer', detail: 'Issue the formal offer letter with: designation, compensation breakdown, joining date, and terms. Set a deadline for acceptance. Track offer status.', system: 'Email / Portal' },
    { step: 7, action: 'Hire & Handoff', detail: 'Upon offer acceptance, move candidate to "Hired" stage. Initiate the Employee Onboarding process (SOP-HR-001). Update the job posting status if the position is filled.', system: '/d/applications → Hired' },
    { step: 8, action: 'Rejection Communication', detail: 'For rejected candidates at any stage, send a professional rejection email. Maintain the application record for future openings with the candidate\'s consent.', system: 'Email' },
  ],
  relatedDocs: ['SOP-ATS-001 (Job Posting)', 'SOP-HR-001 (Employee Onboarding)', 'Interview Evaluation Form', 'Offer Letter Template'],
  kpis: ['Application screening: within 5 business days', 'Interview to offer: < 14 days', 'Offer acceptance rate: > 70%', 'Time to fill: < 45 days'],
};

// ── OPERATIONS ────────────────────────────────────────────────────────────────

const OPS_001: SOP = {
  id: 'SOP-OPS-001',
  title: 'Operations Contract Management',
  department: 'Operations',
  category: 'Project Operations',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the lifecycle of operations contracts linked to projects, ensuring clear scope definition, milestone tracking, and contract compliance.',
  scope: 'Covers all operations contracts from creation through completion or termination, including milestone management.',
  responsibilities: [
    'Operations Team: Creates and manages contracts, tracks milestones',
    'Project Manager: Ensures deliverables align with contract terms',
    'Management: Approves contracts and major scope changes',
    'Accounts Team: Manages contract-related billing and payments',
  ],
  procedure: [
    { step: 1, action: 'Initiate Contract', detail: 'From an active project, navigate to Operations → Contracts. Click "New Contract". Link to the parent project. Enter: contract scope, start date, end date, value, and terms.', system: '/d/operations → New' },
    { step: 2, action: 'Define Milestones', detail: 'Add milestones with: description, target date, deliverables, acceptance criteria, and milestone value (if billing is milestone-based). Each milestone should be measurable and verifiable.', system: '/d/operations/[id] → Milestones' },
    { step: 3, action: 'Set Contract Status', detail: 'Initial status is "Draft". Upon all approvals and client sign-off, update to "Active". Other statuses: Paused (temporary hold), Completed (all deliverables met), Terminated (early exit).', system: '/d/operations/[id]' },
    { step: 4, action: 'Execute & Track', detail: 'During contract execution, update milestone status as deliverables are completed. Record any deviations, change requests, or scope modifications with impact assessment.', system: '/d/operations/[id]' },
    { step: 5, action: 'Client Portal Updates', detail: 'Ensure contract progress is visible on the Client Portal for transparency. Upload relevant documents, test reports (from Lab), and progress photos.', system: '/portal/[projectId]/operations' },
    { step: 6, action: 'Milestone Billing', detail: 'Upon milestone completion and client acceptance, raise the corresponding invoice through the Sales Order system. Link the payment to the contract milestone.', system: '/d/orders → New (linked)' },
    { step: 7, action: 'Contract Closure', detail: 'When all milestones are delivered and payments received, mark the contract as "Completed". Archive all contract documents. Conduct a lessons-learned review.', system: '/d/operations/[id] → Complete' },
  ],
  relatedDocs: ['SOP-PRJ-001 (Project Lifecycle)', 'SOP-ACC-003 (Sales Order Processing)', 'SOP-OPS-002 (Lab Parameters)', 'Contract Template'],
  kpis: ['Contract start within 7 days of project activation', 'Milestone delivery on time: > 85%', 'Contract closure within 30 days of last deliverable'],
};

const OPS_002: SOP = {
  id: 'SOP-OPS-002',
  title: 'Lab Parameter Configuration',
  department: 'Operations',
  category: 'Laboratory Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To establish procedures for configuring and maintaining laboratory testing parameters, instruments, sample types, and industry classifications for accurate and consistent testing operations.',
  scope: 'Covers all lab configuration activities including parameter setup, instrument registration, sample type definition, and industry-wise testing scope management.',
  responsibilities: [
    'Lab Manager: Configures and maintains lab parameters and instruments',
    'Quality Team: Validates parameter accuracy and compliance with testing standards',
    'Operations Manager: Approves new parameter additions and instrument acquisitions',
  ],
  procedure: [
    { step: 1, action: 'Define Sample Types', detail: 'Navigate to Operations → Lab Parameters → Sample Types. Add new sample types with: name, description, and applicable testing standards. Examples: ore samples, water samples, alloy samples.', system: '/d/operations/lab → Sample Types' },
    { step: 2, action: 'Register Instruments', detail: 'Add lab instruments with: instrument name, model, serial number, calibration date, next calibration due, and capability description. Instruments include: ICP-OES, AAS, Wet Chemistry apparatus, Furnace equipment.', system: '/d/operations/lab → Instruments' },
    { step: 3, action: 'Configure Test Parameters', detail: 'Define test parameters with: parameter name, unit of measurement, method reference, detection limit, acceptable range, and linked instrument. Map parameters to applicable sample types.', system: '/d/operations/lab → Parameters' },
    { step: 4, action: 'Set Industry Classifications', detail: 'Configure industry verticals for testing scope: Copper (Cu), Gold (Au), Silver (Ag), Zinc (Zn), Black Mass, Aluminium (Al), and others as applicable.', system: '/d/operations/lab → Industries' },
    { step: 5, action: 'Validate Configuration', detail: 'Run test scenarios with known reference samples to validate parameter settings. Verify detection limits and acceptable ranges match accreditation requirements.', system: 'Lab Validation' },
    { step: 6, action: 'Document & Approve', detail: 'Document all parameter configurations in the Document Registry. Obtain Quality Manager approval for new parameters. Set review dates for periodic validation.', system: '/d/documents' },
    { step: 7, action: 'Calibration Scheduling', detail: 'Set up calibration schedules for all instruments. Track calibration certificates and due dates. Instruments past calibration due date must not be used for testing.', system: '/d/operations/lab → Instruments' },
  ],
  relatedDocs: ['SOP-OPS-001 (Operations Contract)', 'SOP-QMS-001 (Document Control)', 'Instrument Calibration Procedures', 'Testing Method SOPs'],
  kpis: ['Instrument calibration: 100% on time', 'Parameter validation: annual review', 'Testing accuracy: within defined limits'],
};

// ── SALES ─────────────────────────────────────────────────────────────────────

const SAL_001: SOP = {
  id: 'SOP-SAL-001',
  title: 'Lead Management & Qualification',
  department: 'Sales',
  category: 'Business Development',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the identification, qualification, and conversion of sales leads across all categories (customer, supplier, trading partner) using AI-powered discovery and manual processes.',
  scope: 'Covers all lead sources: AI-discovered leads, manual entries, referrals, and registration portal inquiries.',
  responsibilities: [
    'Sales Team: Qualifies leads and manages the conversion pipeline',
    'Market Intelligence Team: Operates the AI lead discovery system',
    'Management: Reviews lead quality metrics and approves strategic partnerships',
  ],
  procedure: [
    { step: 1, action: 'Lead Discovery', detail: 'Leads are generated through: (a) AI-powered multi-provider discovery system (6 AI providers running in parallel on login), (b) manual entry by sales team, (c) external registration portals, (d) referrals from REX Network.', system: '/d/intelligence' },
    { step: 2, action: 'Review New Leads', detail: 'Navigate to Market Intelligence. Review new leads by category: Customer Leads, Supplier Leads, Trading Leads. Check KPIs: total leads, new this week, pending review, and approved count.', system: '/d/intelligence' },
    { step: 3, action: 'Initial Qualification', detail: 'For each new lead, assess: company size, industry relevance, geographic fit, potential value, and credibility. Update status from "New" to "Contacted" after first outreach.', system: '/d/customers/leads or /d/intelligence' },
    { step: 4, action: 'Detailed Evaluation', detail: 'Conduct deeper evaluation: verify company registration, check financial health (if available), assess product/service alignment, and evaluate decision-maker accessibility.', system: 'Research & Verification' },
    { step: 5, action: 'Qualify or Reject', detail: 'Move qualified leads to "Qualified" status. For leads that don\'t meet criteria, mark as "Rejected" with the reason. Maintain rejected leads for potential future re-evaluation.', system: '/d/customers/leads → Status Update' },
    { step: 6, action: 'Approve & Convert', detail: 'Management approves qualified leads for conversion. Approved customer leads proceed to Customer Registration (SOP-SAL-002). Approved supplier leads proceed to Supplier Registration (SOP-ACC-002).', system: '/d/customers/leads → Approve' },
    { step: 7, action: 'Track Conversion', detail: 'Monitor lead-to-customer conversion rate. Analyze lead sources to optimize discovery efforts. Report weekly on pipeline health.', system: '/d/intelligence' },
  ],
  relatedDocs: ['SOP-SAL-002 (Customer Registration)', 'SOP-ACC-001 (Customer Creation)', 'SOP-ACC-002 (Supplier Creation)', 'Lead Scoring Criteria'],
  kpis: ['Lead review time: < 48 hours from discovery', 'Qualification rate: > 20%', 'Lead-to-customer conversion: > 10%', 'AI discovery accuracy: tracked weekly'],
};

const SAL_002: SOP = {
  id: 'SOP-SAL-002',
  title: 'Customer Registration & Approval',
  department: 'Sales',
  category: 'Customer Onboarding',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To process customer registrations received through the external portal, ensuring proper verification and approval before granting access to services.',
  scope: 'Covers all customer registrations from the external portal, including GST verification, email validation, and approval workflow.',
  responsibilities: [
    'Sales Team: Reviews and processes customer registrations',
    'Accounts Team: Verifies GST and financial details',
    'Management: Approves customer onboarding for strategic accounts',
  ],
  procedure: [
    { step: 1, action: 'Registration Submission', detail: 'Prospect fills the Customer Registration form at /customers/register. System captures: company name, GSTIN, PAN, contact person, email, phone, address, and business type.', system: '/customers/register (External)' },
    { step: 2, action: 'Email Verification', detail: 'System sends a verification email to the registered email address. Customer must verify their email before the registration proceeds. Verify link at /customers/verify.', system: '/customers/verify (External)' },
    { step: 3, action: 'Review Registration', detail: 'Navigate to Sales → Registrations. Review pending registrations. Verify: completeness of information, validity of GSTIN (cross-check on GST portal), and legitimacy of the business.', system: '/d/customers/registrations' },
    { step: 4, action: 'Due Diligence', detail: 'For high-value or strategic accounts, perform additional due diligence: company background check, credit assessment, and reference verification.', system: 'External Research' },
    { step: 5, action: 'Approve or Reject', detail: 'Approve valid registrations — system automatically creates the customer record in the master database. Reject incomplete or fraudulent registrations with reason.', system: '/d/customers/registrations → Approve/Reject' },
    { step: 6, action: 'Welcome Communication', detail: 'Send a welcome email to approved customers with: customer code, portal access details, key contacts, and service catalog. Set up any agreed credit terms.', system: 'Email / Portal' },
  ],
  relatedDocs: ['SOP-ACC-001 (Customer Creation)', 'SOP-SAL-001 (Lead Management)', 'Customer Registration Form Template'],
  kpis: ['Registration processing: < 24 hours', 'Approval rate: tracked monthly', 'Customer activation: same day as approval'],
};

// ── PROCUREMENT ───────────────────────────────────────────────────────────────

const PRO_001: SOP = {
  id: 'SOP-PRO-001',
  title: 'Stock & Inventory Management',
  department: 'Procurement',
  category: 'Inventory Control',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage stock and inventory levels, ensuring adequate availability for operations while minimizing carrying costs and preventing stockouts.',
  scope: 'Covers all stock items including raw materials, consumables, and finished goods tracked in the ERP system.',
  responsibilities: [
    'Procurement Team: Manages stock levels and raises purchase orders for replenishment',
    'Operations Team: Reports consumption and usage of stock items',
    'Accounts Team: Maintains accurate stock valuation records',
  ],
  procedure: [
    { step: 1, action: 'Add Stock Item', detail: 'Navigate to Procurement → Stock & Inventory. Use the inline add form to create new stock items. Enter: item name, item code, HSN code, unit of measure, quantity on hand, and unit cost.', system: '/d/stock → Add' },
    { step: 2, action: 'Record Stock Receipts', detail: 'When goods are received against a Purchase Order, update the stock quantity. Verify: items match PO specifications, quantity matches delivery note, and quality is acceptable.', system: '/d/stock → Update Quantity' },
    { step: 3, action: 'Record Stock Issues', detail: 'When stock is consumed for operations or dispatched against a Sales Order, deduct the quantity from stock. Record: issue date, issued to (project/department), and reason.', system: '/d/stock → Update' },
    { step: 4, action: 'Monitor Stock Levels', detail: 'Regularly review stock levels. Use the search function to find items by name, code, or HSN. Identify items below reorder level and initiate purchase orders.', system: '/d/stock' },
    { step: 5, action: 'Stock Valuation', detail: 'System calculates total stock value based on: quantity × unit cost. Review stock valuation reports for financial reporting purposes. Ensure costs are current.', system: '/d/stock' },
    { step: 6, action: 'Physical Verification', detail: 'Conduct periodic physical stock counts (at least quarterly). Compare physical counts with system records. Investigate and adjust discrepancies with proper authorization.', system: '/d/stock → Adjust' },
    { step: 7, action: 'Dispose Obsolete Stock', detail: 'Identify slow-moving or obsolete items. Obtain management approval for disposal or write-off. Record the disposal in the system and adjust stock value.', system: '/d/stock → Delete/Adjust' },
  ],
  relatedDocs: ['SOP-ACC-004 (Purchase Order Processing)', 'SOP-PRO-002 (Shipment Tracking)', 'Stock Verification Sheet', 'Reorder Level Matrix'],
  kpis: ['Stock accuracy: > 98% (physical vs. system)', 'Stockout incidents: < 2 per quarter', 'Stock valuation report: monthly'],
};

const PRO_002: SOP = {
  id: 'SOP-PRO-002',
  title: 'Shipment Tracking',
  department: 'Procurement',
  category: 'Logistics',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To track inward and outward shipments, ensuring timely delivery and maintaining a complete chain of custody for all goods in transit.',
  scope: 'Covers all shipments related to purchase orders (inward) and sales orders (outward).',
  responsibilities: [
    'Procurement/Sales Team: Creates shipment records and monitors delivery status',
    'Operations Team: Manages physical receipt/dispatch of goods',
    'Accounts Team: Processes E-Way Bills and transport documentation',
  ],
  procedure: [
    { step: 1, action: 'Create Shipment Record', detail: 'Navigate to Procurement → Shipments → New. Enter: linked PO/Sales Order, transporter name, vehicle number, dispatch date, expected delivery date, and consignment details.', system: '/d/shipments → New' },
    { step: 2, action: 'Generate E-Way Bill', detail: 'If shipment value exceeds INR 50,000, generate an E-Way Bill (SOP-ACC-011) before dispatch. Link the E-Way Bill number to the shipment record.', system: '/d/eway-bills → New' },
    { step: 3, action: 'Dispatch & Document', detail: 'Record the dispatch with: LR (lorry receipt) number, number of packages, weight, and any special handling instructions. Share tracking details with the recipient.', system: '/d/shipments → Update' },
    { step: 4, action: 'In-Transit Monitoring', detail: 'Track shipment status. Update for any delays, route changes, or issues. For critical shipments, set up alerts for expected delivery date.', system: '/d/shipments' },
    { step: 5, action: 'Receipt Confirmation', detail: 'Upon delivery, record: actual delivery date, received condition, quantity verification, and any damages/shortages. Update stock records accordingly (SOP-PRO-001).', system: '/d/shipments → Delivered' },
    { step: 6, action: 'Client Portal Update', detail: 'For outward shipments, update the Client Portal with delivery status so customers can track their consignments.', system: '/portal/[projectId]/deliveries' },
  ],
  relatedDocs: ['SOP-ACC-004 (Purchase Order Processing)', 'SOP-ACC-011 (E-Way Bill)', 'SOP-PRO-001 (Stock Management)', 'Delivery Note Template'],
  kpis: ['Shipment tracking accuracy: 100%', 'On-time delivery rate: > 90%', 'Damage/shortage incidents: < 2%'],
};

const PRO_003: SOP = {
  id: 'SOP-PRO-003',
  title: 'Re-Invoice Processing',
  department: 'Procurement',
  category: 'Cost Recovery',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To process the re-invoicing of supplier expenses to clients, ensuring accurate cost pass-through with appropriate markup and GST compliance.',
  scope: 'Covers all expenses incurred on behalf of clients that are eligible for re-invoicing, including sub-contracted services, materials, and third-party charges.',
  responsibilities: [
    'Procurement Team: Identifies re-invoiceable expenses and initiates the process',
    'Accounts Team: Prepares re-invoice with correct markup and tax treatment',
    'Management: Approves markup rates and re-invoice amounts',
  ],
  procedure: [
    { step: 1, action: 'Identify Re-Invoiceable Expense', detail: 'Review purchase orders and supplier invoices. Identify expenses incurred on behalf of specific clients per contract terms. Verify the client agreement includes provision for cost pass-through.', system: '/d/purchase-orders' },
    { step: 2, action: 'Create Re-Invoice', detail: 'Navigate to Procurement → Re-Invoice. Select the original Purchase Order and supplier invoice. Enter: client to be billed, original cost, markup percentage, and GST treatment.', system: '/d/reinvoice → New' },
    { step: 3, action: 'Calculate Markup', detail: 'Apply the approved markup rate (as per client contract or standard policy). System calculates: base cost + markup = re-invoice amount. GST is calculated on the re-invoice amount.', system: '/d/reinvoice' },
    { step: 4, action: 'Review & Approve', detail: 'Verify: original supplier invoice is attached, markup is within approved limits, HSN/SAC codes are correct, and GST rate matches the service/goods category.', system: '/d/reinvoice' },
    { step: 5, action: 'Generate Client Invoice', detail: 'Upon approval, the re-invoice generates a corresponding Sales Order/Invoice to the client. This flows into the regular billing cycle.', system: '/d/orders → Auto-created' },
    { step: 6, action: 'Track Payment', detail: 'Monitor client payment against the re-invoice. Reconcile with the original supplier payment to ensure full cost recovery plus margin.', system: '/d/customer-ledger' },
  ],
  relatedDocs: ['SOP-ACC-004 (Purchase Order Processing)', 'SOP-ACC-003 (Sales Order Processing)', 'Re-Invoice Authorization Matrix'],
  kpis: ['Re-invoice turnaround: < 48 hours from supplier invoice', 'Cost recovery rate: 100%', 'Markup accuracy: zero errors'],
};

// ── FINANCE (WEALTH) ─────────────────────────────────────────────────────────

const FIN_001: SOP = {
  id: 'SOP-FIN-001',
  title: 'Investment Portfolio Management',
  department: 'Finance',
  category: 'Wealth Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the company\'s investment portfolio including stock holdings, performance tracking, and buy/sell decision support.',
  scope: 'Covers all equity investments, portfolio performance monitoring, and stock intelligence analysis.',
  responsibilities: [
    'Finance Team: Manages portfolio entries and tracks performance',
    'Management: Makes investment decisions based on analysis',
  ],
  procedure: [
    { step: 1, action: 'Add Investment', detail: 'Navigate to Finance → Investments → New. Enter: stock symbol, company name, quantity purchased, purchase price, purchase date, and brokerage account reference.', system: '/d/investments → New' },
    { step: 2, action: 'Monitor Holdings', detail: 'Review the Investments dashboard for: current portfolio value, individual stock performance, unrealized P&L, and overall return percentage.', system: '/d/investments' },
    { step: 3, action: 'Price Refresh', detail: 'Use the auto-refresh feature to update current market prices for all holdings. System calculates current value and P&L based on latest prices.', system: '/d/investments → Refresh' },
    { step: 4, action: 'Performance Analysis', detail: 'Analyze individual holdings for: absolute returns, percentage returns, performance vs. benchmark, and holding period. Identify underperformers for review.', system: '/d/investments/[id] → Analyze' },
    { step: 5, action: 'Stock Intelligence', detail: 'Use the Stock Intelligence module for deeper analysis: technical signals (Buy/Sell/Hold), market scanners, and correlation analysis with existing portfolio.', system: '/d/stock-intel' },
    { step: 6, action: 'Record Transactions', detail: 'When buying or selling, update the portfolio: add new purchases, record sales with realized P&L, and maintain transaction history.', system: '/d/investments → Edit' },
    { step: 7, action: 'Review & Rebalance', detail: 'Periodically review portfolio allocation. Rebalance if any single holding exceeds concentration limits. Document investment decisions and rationale.', system: '/d/investments' },
  ],
  relatedDocs: ['SOP-ACC-010 (P&L Statement)', 'Investment Policy', 'Risk Appetite Statement'],
  kpis: ['Portfolio review: monthly', 'Price data currency: daily refresh', 'Investment decision documentation: 100%'],
};

const FIN_002: SOP = {
  id: 'SOP-FIN-002',
  title: 'Loan & Credit Card Tracking',
  department: 'Finance',
  category: 'Liability Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To track and manage all company liabilities including loans and credit card obligations, ensuring timely payments and accurate financial reporting.',
  scope: 'Covers all loans (business loans, property loans, vehicle loans) and credit card accounts used for business purposes.',
  responsibilities: [
    'Finance Team: Maintains liability records and tracks payments',
    'Accounts Team: Processes EMI payments and records interest',
    'Management: Reviews overall liability position and approves new borrowing',
  ],
  procedure: [
    { step: 1, action: 'Register Loan', detail: 'Navigate to Finance → Loans → New. Enter: lender name, loan type (Business/Property/Vehicle), sanctioned amount, disbursed amount, interest rate, EMI amount, tenure, and start date.', system: '/d/finance → Loans' },
    { step: 2, action: 'Register Credit Card', detail: 'Navigate to Finance → Credit Cards → New. Enter: bank name, card code (last 4 digits), credit limit, statement cycle day, and payment due date.', system: '/d/finance → Credit Cards' },
    { step: 3, action: 'Track EMI Payments', detail: 'Record each EMI payment with: payment date, EMI amount, principal component, interest component, and remaining outstanding. System auto-calculates outstanding balance.', system: '/d/finance → Loans → Update' },
    { step: 4, action: 'Credit Card Statement Reconciliation', detail: 'On each statement date, update the outstanding amount. Verify charges match recorded business expenses. Flag unauthorized transactions.', system: '/d/finance → Credit Cards → Update' },
    { step: 5, action: 'Payment Processing', detail: 'Ensure EMI auto-debits are set up for loans. For credit cards, process payment before due date to avoid interest/penalties. Record in Cash Book.', system: '/d/cash-book' },
    { step: 6, action: 'Liability Reporting', detail: 'Review the overall liability position: total loans outstanding, credit card balances, interest costs. Factor into net worth calculations on the Finance dashboard.', system: '/d/finance' },
  ],
  relatedDocs: ['SOP-ACC-009 (Bank Reconciliation)', 'SOP-ACC-010 (P&L Statement)', 'Loan Agreement Files'],
  kpis: ['EMI payment: zero defaults', 'Credit card payment: before due date', 'Liability review: monthly'],
};

const FIN_003: SOP = {
  id: 'SOP-FIN-003',
  title: 'Property Asset Management',
  department: 'Finance',
  category: 'Asset Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage company-owned properties including acquisition tracking, financing breakdown, legal compliance, and valuation monitoring.',
  scope: 'Covers all real estate assets owned or under acquisition by the company.',
  responsibilities: [
    'Finance Team: Maintains property records and financing details',
    'Legal Team: Manages registration, stamp duty, and compliance',
    'Management: Approves acquisitions and reviews property portfolio',
  ],
  procedure: [
    { step: 1, action: 'Register Property', detail: 'Navigate to Finance → Properties → New. Enter: property description, location, possession date, total cost, and current market value estimate.', system: '/d/finance → Properties' },
    { step: 2, action: 'Record Financing', detail: 'Enter the financing breakdown: loan amount (if financed), own funds contribution, and loan reference. Link to the corresponding loan record if applicable.', system: '/d/finance → Properties → Edit' },
    { step: 3, action: 'Legal Documentation', detail: 'Record: stamp duty paid, registration charges, legal fees, and registration date. Upload sale deed and registration documents to the Document Registry.', system: '/d/finance → Properties → Edit' },
    { step: 4, action: 'Payment Tracking', detail: 'For under-construction properties, track milestone-based payments: booking amount, foundation, slab, finishing, possession. Record each payment with date and amount.', system: '/d/finance → Properties → Payments' },
    { step: 5, action: 'Valuation Updates', detail: 'Periodically update the market value estimate. Compare with acquisition cost to track appreciation. Factor into net worth calculations.', system: '/d/finance → Properties → Update' },
    { step: 6, action: 'Tax Compliance', detail: 'Ensure property taxes are paid on time. Track municipal tax receipts. Factor rental income (if applicable) into P&L. Maintain records for capital gains computation upon sale.', system: '/d/finance → Properties' },
  ],
  relatedDocs: ['SOP-FIN-002 (Loan Tracking)', 'SOP-ACC-010 (P&L Statement)', 'Property Documents Checklist'],
  kpis: ['Property records: 100% accurate', 'Tax payment: zero defaults', 'Valuation update: annual'],
};

// ── PROJECTS ──────────────────────────────────────────────────────────────────

const PRJ_001: SOP = {
  id: 'SOP-PRJ-001',
  title: 'Project Lifecycle Management',
  department: 'Projects',
  category: 'Project Management',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the complete project lifecycle from initiation through closure, ensuring deliverables meet client expectations, timelines are maintained, and financial performance is tracked.',
  scope: 'Covers all client projects from planning through completion, including milestone tracking, document management, and client portal communication.',
  responsibilities: [
    'Project Manager: Owns the project lifecycle, manages deliverables and timelines',
    'Operations Team: Executes project tasks and manages contracts',
    'Sales/Accounts Team: Handles billing, invoicing, and payment tracking',
    'Management: Approves project initiation, scope changes, and closure',
  ],
  procedure: [
    { step: 1, action: 'Project Initiation', detail: 'Navigate to Projects → New Project. Enter: project code, project name, customer (linked to Customer Master), location, and description. Set initial status to "Planning".', system: '/d/projects/new' },
    { step: 2, action: 'Define Milestones', detail: 'Add project milestones with: milestone name, target date, description, deliverables, and dependencies. Milestones serve as progress checkpoints and may trigger billing.', system: '/d/projects/[id] → Milestones' },
    { step: 3, action: 'Attach Documents', detail: 'Upload project documents: contract, scope of work, specifications, drawings, and reference materials. Maintain version control for all documents.', system: '/d/projects/[id] → Documents' },
    { step: 4, action: 'Activate Project', detail: 'Upon all approvals and contract signing, update project status to "Active". Create the Operations Contract (SOP-OPS-001) to define the execution scope.', system: '/d/projects/[id] → Activate' },
    { step: 5, action: 'Execute & Track', detail: 'Record activities, progress updates, and any issues in the Activities section. Track milestone completion. Log change requests with impact assessment.', system: '/d/projects/[id] → Activities' },
    { step: 6, action: 'Client Portal Management', detail: 'Configure the Client Portal for the project. Clients can view: payments, activities, changes, operations status, documents, deliveries, and milestones. Ensure regular updates.', system: '/portal/[projectId]' },
    { step: 7, action: 'Change Management', detail: 'When scope changes are requested, log them in the Changes section. Assess impact on: timeline, cost, and resources. Obtain client approval before implementing changes.', system: '/d/projects/[id] → Changes' },
    { step: 8, action: 'Billing & Payments', detail: 'Raise invoices per the billing schedule (milestone-based, time-based, or deliverable-based). Track payments through the Sales Order system. Monitor project profitability.', system: '/d/orders' },
    { step: 9, action: 'Project Closure', detail: 'When all deliverables are complete and accepted: update status to "Completed", ensure all payments are received, archive project documents, and conduct a project review.', system: '/d/projects/[id] → Complete' },
    { step: 10, action: 'Lessons Learned', detail: 'Document lessons learned: what went well, what could be improved, and specific recommendations for future projects. Store in the Document Registry.', system: '/d/documents' },
  ],
  relatedDocs: ['SOP-OPS-001 (Operations Contract)', 'SOP-ACC-003 (Sales Order Processing)', 'SOP-PRJ-002 (Client Portal)', 'Project Charter Template'],
  kpis: ['Project on-time delivery: > 85%', 'Client satisfaction: tracked per project', 'Cost variance: < 10%', 'Change request turnaround: < 5 business days'],
};

const PRJ_002: SOP = {
  id: 'SOP-PRJ-002',
  title: 'Client Portal Management',
  department: 'Projects',
  category: 'Client Communication',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the Client Portal, providing clients with real-time visibility into their project status, deliverables, and financials.',
  scope: 'Covers all client-facing portal features including payments, activities, changes, operations, documents, deliveries, and milestones.',
  responsibilities: [
    'Project Manager: Ensures portal content is current and accurate',
    'Operations Team: Updates delivery and operations status',
    'Accounts Team: Updates payment and invoice information',
  ],
  procedure: [
    { step: 1, action: 'Portal Setup', detail: 'When a project is created, the Client Portal is automatically provisioned at /portal/[projectId]. Configure access permissions for the client\'s contacts.', system: '/portal/[projectId]' },
    { step: 2, action: 'Payments Section', detail: 'Keep payment information current: invoices raised, payments received, outstanding amounts. Clients can view their financial status at any time.', system: '/portal/[projectId]/payments' },
    { step: 3, action: 'Activity Updates', detail: 'Post regular activity updates: progress reports, status changes, important milestones achieved. Keep language client-appropriate (non-technical where possible).', system: '/portal/[projectId]/activity' },
    { step: 4, action: 'Change Requests', detail: 'Clients can view and track change requests through the portal. Ensure all changes show: description, impact assessment, status, and approval history.', system: '/portal/[projectId]/changes' },
    { step: 5, action: 'Document Sharing', detail: 'Upload client-facing documents: reports, test results, certificates, and deliverable documentation. Ensure only approved documents are visible.', system: '/portal/[projectId]/documents' },
    { step: 6, action: 'Delivery Tracking', detail: 'Update delivery status for physical consignments. Clients can track: shipment status, expected dates, and delivery confirmation.', system: '/portal/[projectId]/deliveries' },
    { step: 7, action: 'Milestone Visibility', detail: 'Keep milestone status updated. Clients can see: planned vs. actual dates, completion status, and any delays with explanations.', system: '/portal/[projectId]/milestones' },
  ],
  relatedDocs: ['SOP-PRJ-001 (Project Lifecycle)', 'SOP-PRO-002 (Shipment Tracking)', 'Client Communication Policy'],
  kpis: ['Portal update frequency: within 24 hours of any change', 'Client portal login rate: tracked monthly', 'Client satisfaction: tracked per project'],
};

// ── IT ────────────────────────────────────────────────────────────────────────

const IT_001: SOP = {
  id: 'SOP-IT-001',
  title: 'Email Management (Microsoft 365)',
  department: 'IT',
  category: 'Communication',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To establish procedures for managing business email communication through the integrated Microsoft 365 mail client within the ERP system.',
  scope: 'Covers all email operations: sending, receiving, organizing, searching, and archiving business correspondence.',
  responsibilities: [
    'All Users: Follow email management best practices and maintain organized mailboxes',
    'IT Team: Manages Microsoft 365 integration and troubleshoots connectivity issues',
    'Management: Sets email usage policies and retention rules',
  ],
  procedure: [
    { step: 1, action: 'Access Mail Client', detail: 'Navigate to IT → Mail. The integrated mail client connects to your Microsoft 365 account via OAuth. If not authenticated, click "Connect" to initiate the OAuth flow.', system: '/d/mail' },
    { step: 2, action: 'Read & Manage Inbox', detail: 'View incoming emails in the Inbox folder. Unread count is displayed in the sidebar. Use the search function for finding specific emails by subject, sender, or content.', system: '/d/mail → Inbox' },
    { step: 3, action: 'Compose Email', detail: 'Click "Compose" to create a new email. Enter: recipients (To, CC, BCC), subject, body text, and attach files if needed. Review before sending.', system: '/d/mail → Compose' },
    { step: 4, action: 'Organize Emails', detail: 'Use folders to organize: Inbox (active), Sent Items (outgoing record), Drafts (work in progress), and custom folders for project-specific correspondence.', system: '/d/mail → Folders' },
    { step: 5, action: 'Flag & Prioritize', detail: 'Flag important emails for follow-up. Set importance level (High/Normal/Low) when composing. Use flags to create a personal task list from emails.', system: '/d/mail → Flag' },
    { step: 6, action: 'Delete & Clean Up', detail: 'Move unwanted emails to Deleted Items. Regularly clean Junk folder. Follow the data retention policy for email archival.', system: '/d/mail → Delete' },
    { step: 7, action: 'Business Communication Standards', detail: 'Follow company email standards: use professional language, include email signature, CC relevant stakeholders, and respond within 24 business hours.', system: 'Company Email Policy' },
  ],
  relatedDocs: ['SOP-IT-002 (Audit & Security)', 'Email Usage Policy', 'Data Retention Policy'],
  kpis: ['Email response time: < 24 business hours', 'Inbox zero practice: weekly cleanup', 'Phishing report rate: 100% of suspicious emails reported'],
};

const IT_002: SOP = {
  id: 'SOP-IT-002',
  title: 'Audit Trail & Security Monitoring',
  department: 'IT',
  category: 'Security & Compliance',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To monitor system security, track user activities, and maintain a comprehensive audit trail for compliance and investigation purposes.',
  scope: 'Covers all audit logging, security monitoring, analytics, and incident response procedures within the ERP system.',
  responsibilities: [
    'IT Team: Monitors security logs and investigates anomalies',
    'Management: Reviews security reports and approves access changes',
    'All Users: Report suspicious activities and follow security policies',
  ],
  procedure: [
    { step: 1, action: 'Review Audit Trail', detail: 'Navigate to IT → Audit Trail. Review system activities filtered by: Entity Type (customer, order, employee, etc.), Action Type (Create, Update, Delete, Login), or user search.', system: '/d/audit' },
    { step: 2, action: 'Monitor Security Logs', detail: 'Navigate to IT → Security Log. Review: login attempts (successful and failed), IP addresses, device information, and session durations. Flag unusual patterns.', system: '/d/analytics#security' },
    { step: 3, action: 'Track Page Views', detail: 'Review visitor analytics: page views, unique visitors, geographic distribution. Identify unusual traffic patterns that may indicate security threats.', system: '/d/analytics#traffic' },
    { step: 4, action: 'Investigate Changes', detail: 'For any suspicious change, view the audit detail: who made the change, what was changed (old value → new value), when, and from which IP. System captures complete change diffs.', system: '/d/audit → View Detail' },
    { step: 5, action: 'Chat Analytics Review', detail: 'Review chat interaction analytics: volume, patterns, and any flagged conversations. Monitor AI chat usage for appropriate business use.', system: '/d/analytics' },
    { step: 6, action: 'Visitor Insights', detail: 'Analyze visitor insights: organization identification, geographic distribution, and engagement patterns. Use for business intelligence and security assessment.', system: '/d/analytics#orgs' },
    { step: 7, action: 'Incident Response', detail: 'If a security incident is detected: (a) document the incident, (b) assess impact, (c) contain the threat (revoke access if needed), (d) investigate root cause, (e) implement corrective actions, (f) report to management.', system: 'Incident Response Plan' },
    { step: 8, action: 'Access Review', detail: 'Quarterly review of all user access permissions. Revoke access for: separated employees, role changes, and dormant accounts. Document the review.', system: '/d/employees + Microsoft 365 Admin' },
  ],
  relatedDocs: ['SOP-IT-001 (Email Management)', 'SOP-HR-004 (Employee Offboarding)', 'Information Security Policy', 'Incident Response Plan'],
  kpis: ['Security log review: daily', 'Access review: quarterly', 'Incident response time: < 4 hours', 'Audit trail retention: 7 years'],
};

// ── QUALITY ───────────────────────────────────────────────────────────────────

const QMS_001: SOP = {
  id: 'SOP-QMS-001',
  title: 'Document Control',
  department: 'Quality',
  category: 'Quality Management System',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To control the creation, review, approval, distribution, and revision of all IMS documents in compliance with ISO 9001:2015 clause 7.5 (Documented Information).',
  scope: 'Covers all controlled documents: policies, procedures (SOPs), forms, records, and external documents of origin relevant to the IMS.',
  responsibilities: [
    'Document Controller: Manages the Document Registry, version control, and distribution',
    'Document Authors: Create and update documents per this procedure',
    'Quality Manager: Approves all IMS documents before publication',
    'All Employees: Use only current, approved versions of documents',
  ],
  procedure: [
    { step: 1, action: 'Document Request', detail: 'When a new document is needed or an existing document requires revision, submit a request to the Document Controller with: document type, title, purpose, and urgency.', system: 'Internal Request' },
    { step: 2, action: 'Create/Revise Document', detail: 'Author creates the document following the standard template. Assign: document number (per numbering convention), version (start at 1.0), revision (start at 0), title, and department.', system: 'Document Template' },
    { step: 3, action: 'Register in Document Registry', detail: 'Navigate to Quality → Documents. Click "Add Document". Enter: doc number, title, type (Policy/SOP/Form/Record), version, revision, department, and upload the file.', system: '/d/documents → Add' },
    { step: 4, action: 'Submit for Review', detail: 'Set document status to "Under Review". Notify the designated reviewers. Reviewers check: technical accuracy, completeness, clarity, and compliance with IMS requirements.', system: '/d/documents → Status Update' },
    { step: 5, action: 'Approve Document', detail: 'After successful review, the Quality Manager approves the document. Update status to "Approved". Record the effective date.', system: '/d/documents → Approve' },
    { step: 6, action: 'Distribute & Communicate', detail: 'Communicate the new/revised document to all affected personnel. Ensure previous versions are marked as "Superseded" and removed from active use.', system: '/d/documents' },
    { step: 7, action: 'Revision Control', detail: 'When revising a document: increment the revision number, document the changes in a revision history, supersede the previous version, and re-route for approval.', system: '/d/documents → Edit' },
    { step: 8, action: 'Periodic Review', detail: 'All IMS documents must be reviewed at least annually. Track review dates in the Document Registry. Initiate review 30 days before the due date.', system: '/d/documents' },
    { step: 9, action: 'Obsolete Documents', detail: 'Documents no longer needed are marked as "Obsolete". Retain for the specified period per the data retention policy, then archive or destroy.', system: '/d/documents → Status Update' },
  ],
  relatedDocs: ['IMS Manual', 'Document Numbering Convention', 'Data Retention Policy', 'ISO 9001:2015 Clause 7.5'],
  kpis: ['Document review: 100% on schedule', 'Approval turnaround: < 5 business days', 'Obsolete document removal: within 24 hours of supersession'],
};

// ── NETWORK ───────────────────────────────────────────────────────────────────

const NET_001: SOP = {
  id: 'SOP-NET-001',
  title: 'REX Network Member Management',
  department: 'Network',
  category: 'Partner Ecosystem',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the REX Network partner ecosystem, including member registration, classification, and engagement tracking.',
  scope: 'Covers all REX Network member activities: registration, activation, profile management, and member-employee linking.',
  responsibilities: [
    'Network Manager: Oversees REX member lifecycle and engagement',
    'HR Team: Links REX members to employee profiles when applicable',
    'Management: Approves strategic network partnerships',
  ],
  procedure: [
    { step: 1, action: 'Member Registration', detail: 'New REX members register through the external portal or are manually added. Capture: REX ID, full name, email, LinkedIn profile, areas of interest/expertise.', system: '/d/rex → Add' },
    { step: 2, action: 'Classify Member Type', detail: 'Assign the appropriate member type: Student (academic partnership), Professional (industry expert), Academic (research collaboration), or Enthusiast (community member).', system: '/d/rex → Edit' },
    { step: 3, action: 'Verify & Activate', detail: 'Verify member credentials: LinkedIn profile, professional background, and stated expertise. Upon verification, set status to "Active".', system: '/d/rex → Activate' },
    { step: 4, action: 'Link to Employee (if applicable)', detail: 'If a REX member is hired as an employee, link the REX member profile to the employee record. This maintains the network relationship alongside the employment relationship.', system: '/d/employees → REX Link' },
    { step: 5, action: 'Engagement Tracking', detail: 'Track member engagement: project collaborations, referrals made, events attended, and contributions to the network. Update activity history regularly.', system: '/d/rex/[id]' },
    { step: 6, action: 'Deactivation', detail: 'For members who are no longer active or wish to leave the network, set status to "Inactive". Retain the record for historical reference and potential re-engagement.', system: '/d/rex → Deactivate' },
  ],
  relatedDocs: ['SOP-NET-002 (Partner Registration)', 'SOP-HR-001 (Employee Onboarding)', 'REX Network Charter', 'Member Engagement Framework'],
  kpis: ['Member activation: within 72 hours of registration', 'Active member ratio: > 60%', 'Referral conversion rate: tracked quarterly'],
};

const NET_002: SOP = {
  id: 'SOP-NET-002',
  title: 'Partner Registration & Approval',
  department: 'Network',
  category: 'Partner Ecosystem',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To manage the registration and approval process for all partner types: suppliers, customers, and trading partners through external portals.',
  scope: 'Covers all partner registrations from external portals and their integration into the ERP system.',
  responsibilities: [
    'Network/Sales Team: Reviews and processes partner registrations',
    'Accounts Team: Validates financial and tax information',
    'Management: Approves strategic partnerships',
  ],
  procedure: [
    { step: 1, action: 'Registration Received', detail: 'Partner registrations arrive via: Supplier Registration Portal (/suppliers/register), Customer Registration Portal (/customers/register), or manual entry by the sales/procurement team.', system: 'External Portals' },
    { step: 2, action: 'Review Queue', detail: 'Navigate to the appropriate registration queue: Network → Supplier Registrations for suppliers, Sales → Registrations for customers, Sales → Trading Partners for trading partners.', system: '/d/supplier-reg or /d/customers/registrations' },
    { step: 3, action: 'Validation', detail: 'Verify all submitted information: company name, GSTIN, PAN, contact details, business type, and any uploaded documents. Cross-check GSTIN on the GST portal.', system: 'Registration Detail Page' },
    { step: 4, action: 'Background Check', detail: 'For new partners, conduct a basic background check: company existence verification, financial health (if available), and any adverse reports. For trading partners, verify import-export credentials if applicable.', system: 'External Research' },
    { step: 5, action: 'Approve or Reject', detail: 'Approve valid registrations — system creates the corresponding master record (Customer, Supplier, or Trading Partner). Reject with documented reason for incomplete or non-compliant registrations.', system: 'Registration → Approve/Reject' },
    { step: 6, action: 'Onboarding Communication', detail: 'Send onboarding confirmation: assigned partner code, primary contact details, access instructions (portal/email), and initial terms of engagement.', system: 'Email' },
    { step: 7, action: 'Periodic Review', detail: 'Review active partners annually: verify GST status is still active, update contact information, assess relationship health, and renew terms if applicable.', system: 'Partner Review Schedule' },
  ],
  relatedDocs: ['SOP-ACC-001 (Customer Creation)', 'SOP-ACC-002 (Supplier Creation)', 'SOP-SAL-002 (Customer Registration)', 'Partner Code of Conduct'],
  kpis: ['Registration processing: < 48 hours', 'Partner data accuracy: > 99%', 'Annual review completion: 100% of active partners'],
};

// ── SETTINGS ──────────────────────────────────────────────────────────────────

const SET_001: SOP = {
  id: 'SOP-SET-001',
  title: 'System Configuration Management',
  department: 'IT',
  category: 'System Administration',
  version: '1.0',
  effectiveDate: '2026-04-15',
  reviewDate: '2027-04-15',
  approvedBy: 'Management Representative',
  purpose: 'To control changes to system configuration including company settings, integrations, and user access management.',
  scope: 'Covers all ERP system configuration changes: company details, branding, integration settings, and role-based access control.',
  responsibilities: [
    'IT Administrator: Manages system configuration and access control',
    'Management: Approves configuration changes that affect business operations',
    'All Users: Report configuration issues through proper channels',
  ],
  procedure: [
    { step: 1, action: 'Access Settings', detail: 'Navigate to Settings. Only users with admin role can access system configuration. All changes are logged in the Audit Trail.', system: '/d/settings' },
    { step: 2, action: 'Company Details', detail: 'Maintain company information: registered name, address, GSTIN, PAN, CIN (if incorporated), contact details, and bank account information. Ensure alignment with statutory registrations.', system: '/d/settings → Company' },
    { step: 3, action: 'Branding', detail: 'Configure branding elements: company logo, primary colors, and email templates. Changes reflect across all customer-facing outputs (invoices, quotations, emails).', system: '/d/settings → Branding' },
    { step: 4, action: 'Integration Settings', detail: 'Manage third-party integrations: Microsoft 365 (email), Supabase (database), AI providers (Ollama/Groq/Claude), and any other connected services.', system: '/d/settings → Integrations' },
    { step: 5, action: 'User Access Management', detail: 'Manage user roles and permissions: Admin (full access), User (department-specific access), Client (portal access only). Follow the principle of least privilege.', system: '/d/settings → Users' },
    { step: 6, action: 'Change Documentation', detail: 'Document all significant configuration changes: what was changed, why, who approved it, and the effective date. Review the Audit Trail to verify changes were applied correctly.', system: '/d/audit' },
  ],
  relatedDocs: ['SOP-IT-002 (Audit & Security)', 'SOP-HR-001 (Employee Onboarding)', 'IT Configuration Baseline', 'Access Control Policy'],
  kpis: ['Configuration change documentation: 100%', 'Unauthorized access attempts: zero tolerance', 'Access review: quarterly'],
};

// ── EXPORT ────────────────────────────────────────────────────────────────────

export const ALL_SOPS: SOP[] = [
  // Accounts (12)
  ACC_001, ACC_002, ACC_003, ACC_004, ACC_005, ACC_006,
  ACC_007, ACC_008, ACC_009, ACC_010, ACC_011, ACC_012,
  // HR (4)
  HR_001, HR_002, HR_003, HR_004,
  // ATS (2)
  ATS_001, ATS_002,
  // Operations (2)
  OPS_001, OPS_002,
  // Sales (2)
  SAL_001, SAL_002,
  // Procurement (3)
  PRO_001, PRO_002, PRO_003,
  // Finance (3)
  FIN_001, FIN_002, FIN_003,
  // Projects (2)
  PRJ_001, PRJ_002,
  // IT (2)
  IT_001, IT_002,
  // Quality (1)
  QMS_001,
  // Network (2)
  NET_001, NET_002,
  // Settings (1)
  SET_001,
];

export const DEPARTMENTS = [
  'Accounts',
  'Human Resources',
  'Recruitment',
  'Operations',
  'Sales',
  'Procurement',
  'Finance',
  'Projects',
  'IT',
  'Quality',
  'Network',
] as const;

export function getSOPById(id: string): SOP | undefined {
  return ALL_SOPS.find(sop => sop.id === id);
}

export function getSOPsByDepartment(dept: string): SOP[] {
  return ALL_SOPS.filter(sop => sop.department === dept);
}
