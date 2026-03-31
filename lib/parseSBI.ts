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
  Jan: '01', Feb: '02', Mar: '03', Apr: '04',
  May: '05', Jun: '06', Jul: '07', Aug: '08',
  Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

export function splitCSV(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

export function parseSBIDate(s: string): string | null {
  const clean = s.trim().replace(/^"|"$/g, '');
  const parts = clean.split(' ');
  if (parts.length !== 3) return null;
  const [day, mon, year] = parts;
  const m = MONTHS[mon];
  if (!m) return null;
  const d = day.padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseAmt(s: string): number {
  const clean = s.trim().replace(/^"|"$/g, '').replace(/,/g, '');
  if (clean === '' || clean === '-') return 0;
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export function parseSBI(text: string): ParsedStatement {
  const lines = text.split(/\r?\n/);

  let account_no  = '';
  let period_from = '';
  let period_to   = '';
  let headerIdx   = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fields = splitCSV(line);

    if (fields[0]?.toLowerCase().includes('account number') && fields[1]) {
      const raw = fields[1].replace(/^_/, '').replace(/\D/g, '');
      account_no = raw.length >= 4 ? `****${raw.slice(-4)}` : raw;
    }

    if (fields[0]?.toLowerCase().includes('start date') && fields[1]) {
      period_from = parseSBIDate(fields[1]) ?? '';
    }

    if (fields[0]?.toLowerCase().includes('end date') && fields[1]) {
      period_to = parseSBIDate(fields[1]) ?? '';
    }

    if (fields[0]?.trim().toLowerCase() === 'txn date') {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error('Could not find transaction header row ("Txn Date") in CSV.');
  }

  const transactions: ParsedTxn[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const f = splitCSV(line);
    if (f.length < 7) continue;

    const txn_date   = parseSBIDate(f[0]);
    const value_date = parseSBIDate(f[1]);

    if (!txn_date || !value_date) continue;

    transactions.push({
      txn_date,
      value_date,
      description: f[2] ?? '',
      ref_no:      f[3] ?? '',
      branch_code: f[4] ?? '',
      debit:       parseAmt(f[5]),
      credit:      parseAmt(f[6]),
      balance:     f[7] !== undefined ? parseAmt(f[7]) : 0,
    });
  }

  return { account_no, period_from, period_to, transactions };
}
