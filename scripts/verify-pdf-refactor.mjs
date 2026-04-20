#!/usr/bin/env node
/* Verification harness for the Report Module refactor.
 *
 * Usage:
 *   node scripts/verify-pdf-refactor.mjs before   # generates ...-before.pdf
 *   node scripts/verify-pdf-refactor.mjs after    # generates ...-after.pdf
 *
 * The harness pulls three reference rows:
 *   - Quote:    QT-2026-003
 *   - Invoice:  first orders row (SVC-001 or similar)
 *   - PO:       PO-2026-001
 *
 * and emits them to .buddy/report-refactor-verify/ for human A/B compare.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load env.local manually (no dotenv dep)
const envText = fs.readFileSync('.env.local', 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const mode = (process.argv[2] || 'before').toLowerCase();
const outDir = '.buddy/report-refactor-verify';
fs.mkdirSync(outDir, { recursive: true });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function pickIds() {
  const q = await sb.from('quotes').select('id,quote_no').eq('quote_no', 'QT-2026-003').single();
  const o = await sb.from('orders').select('id,order_no').limit(1).order('created_at', { ascending: true }).single();
  const p = await sb.from('purchase_orders').select('id,po_no').eq('po_no', 'PO-2026-001').single();
  return { quoteId: q.data?.id, orderId: o.data?.id, poId: p.data?.id, orderNo: o.data?.order_no };
}

async function run() {
  const { quoteId, orderId, poId, orderNo } = await pickIds();
  console.log(`mode=${mode} quote=${quoteId} order=${orderId}(${orderNo}) po=${poId}`);

  // dynamic imports of TS-transpiled modules via ts-node / tsx
  const { generateQuotePdfBuffer } = await import('../lib/quotePdf.ts');
  const { generateInvoicePdfBuffer } = await import('../lib/invoicePdf.ts');
  const { generatePurchaseOrderPdfBuffer } = await import('../lib/purchaseOrderPdf.ts');

  const suffix = mode === 'after' ? '' : '-before';

  const qr = await generateQuotePdfBuffer(quoteId);
  fs.writeFileSync(path.join(outDir, `quote${suffix}.pdf`), qr.buffer);
  console.log(`  quote -> ${qr.filename} (${qr.buffer.length} bytes)`);

  const ir = await generateInvoicePdfBuffer(orderId);
  fs.writeFileSync(path.join(outDir, `invoice${suffix}.pdf`), ir.buffer);
  console.log(`  invoice -> ${ir.filename} (${ir.buffer.length} bytes)`);

  const pr = await generatePurchaseOrderPdfBuffer(poId);
  fs.writeFileSync(path.join(outDir, `po${suffix}.pdf`), pr.buffer);
  console.log(`  po -> ${pr.filename} (${pr.buffer.length} bytes)`);

  console.log(`done — wrote to ${outDir}`);
}

run().catch(e => { console.error(e); process.exit(1); });
