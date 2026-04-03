export interface ParsedTxn {
  txn_date:    string;
  value_date:  string;
  description: string;
  ref_no:      string;
  branch_code: string;
  debit:       number;
  credit:      number;
  balance:     number;
}

export interface ParsedStatement {
  account_no:   string;
  period_from:  string;
  period_to:    string;
  transactions: ParsedTxn[];
}

const MONTHS: Record<string, string> = {
  Jan:'01', Feb:'02', Mar:'03', Apr:'04',
  May:'05', Jun:'06', Jul:'07', Aug:'08',
  Sep:'09', Oct:'10', Nov:'11', Dec:'12',
};

export function parseSBIDate(s: string): string | null {
  const clean = s.trim().replace(/^"|"$/g, '');

  // "8 Oct 2025" or "08 Oct 2025"
  const p = clean.split(/\s+/);
  if (p.length === 3 && MONTHS[p[1]]) {
    return `${p[2]}-${MONTHS[p[1]]}-${p[0].padStart(2, '0')}`;
  }

  // "10/8/2025" or "10/8/25" (SheetJS M/D/YY or M/D/YYYY)
  const slash = clean.split('/');
  if (slash.length === 3) {
    const [m, d, rawY] = slash;
    const y = rawY.length === 2 ? `20${rawY}` : rawY;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  return null;
}

export function parseAmt(s: string): number {
  const clean = String(s).trim().replace(/^"|"$/g, '').replace(/,/g, '');
  if (clean === '' || clean === '-') return 0;
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export function splitCSV(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

// ── CSV text parser ─────────────────────────────────────────

function parseCSVText(lines: string[]): ParsedStatement {
  let account_no  = '';
  let period_from = '';
  let period_to   = '';
  let headerIdx   = -1;

  for (let i = 0; i < lines.length; i++) {
    const f = splitCSV(lines[i]);
    const key = f[0]?.toLowerCase() ?? '';
    if (key.includes('account number') && f[1])
      account_no = maskAccNo(f[1]);
    if (key.includes('start date') && f[1])
      period_from = parseSBIDate(f[1]) ?? '';
    if (key.includes('end date') && f[1])
      period_to = parseSBIDate(f[1]) ?? '';
    if (f[0]?.trim().toLowerCase() === 'txn date') {
      headerIdx = i; break;
    }
  }

  if (headerIdx === -1) throw new Error('Could not find "Txn Date" header in CSV.');

  const transactions: ParsedTxn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const f = splitCSV(lines[i]);
    if (f.length < 7) continue;
    const txn_date   = parseSBIDate(f[0]);
    if (!txn_date) continue;
    const value_date = parseSBIDate(f[1]) ?? txn_date;
    transactions.push({
      txn_date, value_date,
      description: f[2] ?? '',
      ref_no:      f[3] ?? '',
      branch_code: f[4] ?? '',
      debit:       parseAmt(f[5]),
      credit:      parseAmt(f[6]),
      balance:     parseAmt(f[7] ?? ''),
    });
  }

  return { account_no, period_from, period_to, transactions };
}

// ── ASCII fixed-width parser ────────────────────────────────
// SBI ASCII download: wide fixed-width columns, tab or space padded

function parseFixedWidth(lines: string[]): ParsedStatement {
  let account_no  = '';
  let period_from = '';
  let period_to   = '';
  let headerIdx   = -1;
  let headerLine  = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (lower.includes('account number')) {
      const val = line.replace(/account number/i, '').trim().replace(/^_+/, '').replace(/\D/g,'');
      account_no = maskAccNo(val);
    }
    if (lower.includes('start date')) {
      const val = line.replace(/start date/i, '').trim();
      period_from = parseSBIDate(val) ?? '';
    }
    if (lower.includes('end date')) {
      const val = line.replace(/end date/i, '').trim();
      period_to = parseSBIDate(val) ?? '';
    }
    if (/txn\s+date/i.test(line) && /value\s+date/i.test(line)) {
      headerIdx  = i;
      headerLine = line;
      break;
    }
  }

  if (headerIdx === -1) throw new Error('Could not find transaction header in ASCII file.');

  // Determine column start positions from header row
  const debitPos   = headerLine.search(/\bDebit\b/i);
  const creditPos  = headerLine.search(/\bCredit\b/i);
  const balancePos = headerLine.search(/\bBalance\b/i);

  const transactions: ParsedTxn[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Dates occupy first ~36 characters: "D Mon YYYY   D Mon YYYY   "
    const txnDateStr = line.slice(0, 13).trim();
    const valDateStr = line.slice(13, 36).trim();
    const txn_date   = parseSBIDate(txnDateStr);
    if (!txn_date) continue;
    const value_date = parseSBIDate(valDateStr) ?? txn_date;

    // Numeric columns by position (if header positions are known)
    let debit   = 0;
    let credit  = 0;
    let balance = 0;

    if (debitPos > 0 && creditPos > 0 && balancePos > 0) {
      debit   = parseAmt(line.slice(debitPos,  creditPos));
      credit  = parseAmt(line.slice(creditPos, balancePos));
      balance = parseAmt(line.slice(balancePos));
    } else {
      // Fallback: grab trailing numbers separated by 2+ spaces
      const nums = line.trim().match(/[\d,]+\.\d{2}/g) ?? [];
      // Last number is balance, second-to-last is debit or credit
      if (nums.length >= 1) balance = parseAmt(nums[nums.length - 1]);
      if (nums.length >= 2) {
        // Determine debit vs credit from the amount position
        const secondLast = nums[nums.length - 2];
        const pos = line.lastIndexOf(secondLast, line.lastIndexOf(nums[nums.length - 1]) - 1);
        const mid = (debitPos + creditPos) / 2;
        if (pos < mid) debit = parseAmt(secondLast);
        else credit = parseAmt(secondLast);
      }
    }

    // Description / ref / branch: middle section split by 3+ spaces
    const endOfDates = 36;
    const startOfNums = debitPos > 0 ? debitPos : line.length;
    const middle = line.slice(endOfDates, startOfNums);
    const parts  = middle.trim().split(/\s{3,}/);

    transactions.push({
      txn_date, value_date,
      description: (parts[0] ?? '').trim(),
      ref_no:      (parts[1] ?? '').trim(),
      branch_code: (parts[2] ?? '').trim(),
      debit, credit, balance,
    });
  }

  return { account_no, period_from, period_to, transactions };
}

// ── Main text entry point (CSV or ASCII auto-detect) ────────

export function parseSBI(text: string): ParsedStatement {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  // If the header row has commas it's CSV, otherwise fixed-width ASCII
  const headerLine = lines.find(l => /txn\s*date/i.test(l)) ?? '';
  if (headerLine.includes(',')) return parseCSVText(lines);
  return parseFixedWidth(lines);
}

// ── Helpers ─────────────────────────────────────────────────

function maskAccNo(raw: string): string {
  const digits = raw.replace(/^_+/, '').replace(/\D/g, '');
  return digits.length >= 4 ? `****${digits.slice(-4)}` : digits;
}
