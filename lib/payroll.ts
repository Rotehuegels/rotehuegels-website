// ── Payroll calculation helpers (shared between API and pages) ────────────────

const EPF_BASIC_CEILING = 15000;
const ESI_GROSS_LIMIT   = 21000;

/**
 * Tamil Nadu professional tax (half-yearly slab).
 * Deducted only in April (4) and October (10) — the start of each half-year.
 * Slab is based on gross × 6 (half-yearly equivalent).
 * Max ₹1,250 per half-year = ₹2,500/year.
 */
export function professionalTax(grossMonthly: number, month: number): number {
  if (month !== 4 && month !== 10) return 0;
  const hy = grossMonthly * 6;
  if (hy <= 21000)  return 0;
  if (hy <= 30000)  return 135;
  if (hy <= 45000)  return 315;
  if (hy <= 60000)  return 690;
  if (hy <= 75000)  return 1025;
  return 1250;
}

export function epfEmployee(basic: number): number {
  return Math.round(Math.min(basic, EPF_BASIC_CEILING) * 0.12);
}

export function epfEmployer(basic: number): number {
  // 12% employee A/c + 0.5% admin charges (simplified to 12%)
  return Math.round(Math.min(basic, EPF_BASIC_CEILING) * 0.12);
}

export function esiEmployee(gross: number): number {
  if (gross > ESI_GROSS_LIMIT) return 0;
  return Math.round(gross * 0.0075);
}

export function esiEmployer(gross: number): number {
  if (gross > ESI_GROSS_LIMIT) return 0;
  return Math.round(gross * 0.0325);
}

export interface SalaryInput {
  basic: number;
  hra: number;
  special_allowance: number;
  other_allowance: number;
  bonus: number;
  working_days: number;
  days_present: number;
  lop_days: number;
  tds: number;
  advance_recovery: number;
  other_deductions: number;
  epf_enabled: boolean;
  esi_enabled: boolean;
  pt_enabled: boolean;
  month: number; // 1-12
}

export interface SalaryOutput {
  gross_pay: number;
  lop_deduction: number;
  epf_employee: number;
  epf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  total_deductions: number;
  net_pay: number;
  employer_cost: number; // gross + epf_employer + esi_employer
}

export function computePayroll(inp: SalaryInput): SalaryOutput {
  const preLopGross = inp.basic + inp.hra + inp.special_allowance + inp.other_allowance + inp.bonus;
  const safeWorkingDays = Math.max(inp.working_days, 1);
  const lopDed = inp.lop_days > 0
    ? Math.round((preLopGross / safeWorkingDays) * inp.lop_days)
    : 0;
  const gross = Math.max(0, preLopGross - lopDed);

  const epfE  = inp.epf_enabled ? epfEmployee(inp.basic) : 0;
  const epfEr = inp.epf_enabled ? epfEmployer(inp.basic) : 0;
  const esiE  = inp.esi_enabled ? esiEmployee(gross)     : 0;
  const esiEr = inp.esi_enabled ? esiEmployer(gross)     : 0;
  const pt    = inp.pt_enabled  ? professionalTax(gross, inp.month) : 0;

  const totalDed = epfE + esiE + pt + inp.tds + inp.advance_recovery + inp.other_deductions;
  const net      = Math.max(0, gross - totalDed);

  return {
    gross_pay: gross,
    lop_deduction: lopDed,
    epf_employee: epfE,
    epf_employer: epfEr,
    esi_employee: esiE,
    esi_employer: esiEr,
    professional_tax: pt,
    total_deductions: totalDed,
    net_pay: net,
    employer_cost: gross + epfEr + esiEr,
  };
}

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function numToWords(n: number): string {
  if (n === 0) return 'Zero';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function words(num: number): string {
    if (num === 0) return '';
    if (num < 20) return a[num] + ' ';
    if (num < 100) return b[Math.floor(num / 10)] + ' ' + a[num % 10] + ' ';
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred ' + words(num % 100);
    if (num < 100000) return words(Math.floor(num / 1000)) + 'Thousand ' + words(num % 1000);
    if (num < 10000000) return words(Math.floor(num / 100000)) + 'Lakh ' + words(num % 100000);
    return words(Math.floor(num / 10000000)) + 'Crore ' + words(num % 10000000);
  }

  const rupees = Math.floor(n);
  const paise  = Math.round((n - rupees) * 100);
  let result   = words(rupees).trim() + ' Rupees';
  if (paise > 0) result += ' and ' + words(paise).trim() + ' Paise';
  return result + ' Only';
}
