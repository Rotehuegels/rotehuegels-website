import { NextResponse } from 'next/server';
import { getLogoDataUrl, getSignatureDataUrl, fmtINR, fmtDate, generateSmartPdf } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell, TABLE_LAYOUT, sectionLabel } from '@/lib/pdfTemplate';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const sigUrl = getSignatureDataUrl();

    const [grnRes, itemsRes] = await Promise.all([
      supabaseAdmin
        .from('goods_receipt_notes')
        .select('*, suppliers(legal_name, trade_name, gstin, address, state, pincode, email, phone), purchase_orders(po_no, po_date, total_amount, supplier_ref, linked_order_id)')
        .eq('id', id)
        .single(),
      supabaseAdmin.from('grn_items').select('*').eq('grn_id', id).order('created_at'),
    ]);
    if (grnRes.error || !grnRes.data) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 });
    }

    const grn = grnRes.data as any;
    const supplier = grn.suppliers as any;
    const po = grn.purchase_orders as any;
    const items = itemsRes.data ?? [];

    const totalAccepted = items.reduce((s, it: any) => s + Number(it.accepted_qty ?? 0), 0);
    const totalRejected = items.reduce((s, it: any) => s + Number(it.rejected_qty ?? 0), 0);
    const totalValue = items.reduce((s, it: any) => s + Number(it.accepted_qty ?? 0) * Number(it.unit_price ?? 0), 0);

    const content: any[] = [];

    // ── Header ────────────────────────────────────────────────────────────
    content.push(buildHeader({
      logoUrl,
      companyName: CO.name,
      address: `${CO.addr1} ${CO.addr2}`,
      contactLine: `${CO.procurementEmail}  |  ${CO.phone}  |  ${CO.web}`,
      gstin: CO.gstin,
      pan: CO.pan,
      cin: CO.cin,
      tan: CO.tan,
      documentTitle: 'GOODS RECEIPT NOTE',
    }));

    // ── GRN metadata ──────────────────────────────────────────────────────
    content.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto', alignment: 'right',
          stack: [
            { text: `GRN No: ${grn.grn_no}`, fontSize: FONT.body, bold: true },
            { text: `Date: ${fmtDate(grn.receipt_date)}`, fontSize: FONT.body },
            ...(po?.po_no ? [{ text: `Against PO: ${po.po_no} dated ${fmtDate(po.po_date)}`, fontSize: FONT.body }] : []),
            ...(grn.delivery_note_no ? [{ text: `Supplier Ref: ${grn.delivery_note_no}`, fontSize: FONT.body }] : []),
          ],
        },
      ],
      margin: [0, 0, 0, 8],
    });

    // ── Status badge ──────────────────────────────────────────────────────
    const statusLabels: Record<string, string> = {
      pending:   'PENDING INSPECTION',
      inspected: 'INSPECTED',
      accepted:  'ACCEPTED',
      rejected:  'REJECTED',
      partial:   'PARTIAL',
    };
    content.push({
      columns: [
        {
          width: 'auto',
          text: statusLabels[grn.status] ?? String(grn.status ?? '').toUpperCase(),
          fontSize: 7, bold: true, color: '#fff',
          fillColor: grn.status === 'accepted' ? '#16a34a'
            : grn.status === 'rejected' ? '#dc2626'
            : grn.status === 'partial' ? '#f97316'
            : '#64748b',
          margin: [5, 2, 5, 2],
        },
        { width: '*', text: '' },
      ],
      margin: [0, 0, 0, 8],
    });

    // ── Supplier + Received-by block ──────────────────────────────────────
    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              sectionLabel('SUPPLIER (RECEIVED FROM)'),
              { text: supplier?.legal_name ?? '-', fontSize: FONT.heading, bold: true },
              ...(supplier?.gstin ? [{ text: `GSTIN: ${supplier.gstin}`, fontSize: FONT.body, margin: [0, 2, 0, 0] }] : []),
              ...(supplier?.address ? [{
                text: `${supplier.address}${supplier.state ? ', ' + supplier.state : ''}${supplier.pincode ? ' - ' + supplier.pincode : ''}`,
                fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0],
              }] : []),
              ...(supplier?.email ? [{ text: `Email: ${supplier.email}`, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] }] : []),
              ...(supplier?.phone ? [{ text: `Phone: ${supplier.phone}`, fontSize: FONT.small, color: COLORS.gray }] : []),
            ],
          },
          {
            stack: [
              sectionLabel('RECEIVED AT'),
              { text: CO.name, fontSize: FONT.heading, bold: true },
              { text: `GSTIN: ${CO.gstin}`, fontSize: FONT.body, margin: [0, 2, 0, 0] },
              ...(grn.warehouse_location ? [{ text: `Location: ${grn.warehouse_location}`, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] }] : []),
              ...(grn.received_by ? [{ text: `Received by: ${grn.received_by}`, fontSize: FONT.small, color: COLORS.gray }] : []),
              ...(grn.vehicle_no ? [{ text: `Vehicle No: ${grn.vehicle_no}`, fontSize: FONT.small, color: COLORS.gray }] : []),
              ...(grn.transporter ? [{ text: `Transporter: ${grn.transporter}`, fontSize: FONT.small, color: COLORS.gray }] : []),
            ],
          },
        ]],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 10],
    });

    // ── Items table ───────────────────────────────────────────────────────
    const headerRow = [
      tableHeaderCell('#'),
      tableHeaderCell('Description'),
      tableHeaderCell('HSN'),
      tableHeaderCell('Ordered', 'right'),
      tableHeaderCell('Received', 'right'),
      tableHeaderCell('Accepted', 'right'),
      tableHeaderCell('Rejected', 'right'),
      tableHeaderCell('Unit', 'right'),
      tableHeaderCell('Rate', 'right'),
      tableHeaderCell('Value', 'right'),
    ];

    const itemRows = items.map((it: any, i: number) => {
      const v = Number(it.accepted_qty ?? 0) * Number(it.unit_price ?? 0);
      return [
        { text: String(i + 1), fontSize: FONT.table, alignment: 'center' },
        { text: it.description ?? '', fontSize: FONT.table, margin: [0, 0, 0, 0] },
        { text: it.hsn_code ?? '', fontSize: FONT.table, alignment: 'center' },
        { text: String(Number(it.ordered_qty ?? 0)), fontSize: FONT.table, alignment: 'right' },
        { text: String(Number(it.received_qty ?? 0)), fontSize: FONT.table, alignment: 'right' },
        { text: String(Number(it.accepted_qty ?? 0)), fontSize: FONT.table, alignment: 'right', color: COLORS.positive },
        { text: Number(it.rejected_qty ?? 0) ? String(Number(it.rejected_qty)) : '–', fontSize: FONT.table, alignment: 'right', color: Number(it.rejected_qty ?? 0) ? COLORS.negative : COLORS.gray },
        { text: it.unit ?? '', fontSize: FONT.table, alignment: 'center' },
        { text: fmtINR(Number(it.unit_price ?? 0)), fontSize: FONT.table, alignment: 'right' },
        { text: fmtINR(v), fontSize: FONT.table, alignment: 'right' },
      ];
    });

    content.push({
      table: {
        headerRows: 1,
        widths: [20, '*', 45, 40, 40, 40, 40, 30, 55, 60],
        body: [headerRow, ...itemRows],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 6],
    });

    // ── Totals ────────────────────────────────────────────────────────────
    content.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          table: {
            body: [
              [{ text: 'Total Items Accepted:', fontSize: FONT.body, bold: true, alignment: 'right' }, { text: String(totalAccepted), fontSize: FONT.body, bold: true, alignment: 'right', color: COLORS.positive }],
              ...(totalRejected > 0 ? [[{ text: 'Total Items Rejected:', fontSize: FONT.body, bold: true, alignment: 'right' }, { text: String(totalRejected), fontSize: FONT.body, bold: true, alignment: 'right', color: COLORS.negative }]] : []),
              [{ text: 'Total Accepted Value:', fontSize: FONT.total, bold: true, alignment: 'right' }, { text: fmtINR(totalValue), fontSize: FONT.total, bold: true, alignment: 'right' }],
            ],
          },
          layout: TABLE_LAYOUT,
        },
      ],
      margin: [0, 0, 0, 10],
    });

    // ── Inspection notes ──────────────────────────────────────────────────
    if (grn.inspection_notes) {
      content.push(sectionLabel('INSPECTION NOTES'));
      content.push({ text: grn.inspection_notes, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 8], lineHeight: 1.3 });
    }

    // ── General notes ─────────────────────────────────────────────────────
    if (grn.notes) {
      content.push(sectionLabel('NOTES'));
      content.push({ text: grn.notes, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 8], lineHeight: 1.3 });
    }

    // ── Signature block ───────────────────────────────────────────────────
    content.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          stack: [
            ...(sigUrl ? [{ image: sigUrl, width: 80, margin: [0, 10, 0, 0] }] : [{ text: '\n\n\n\n\n', fontSize: FONT.small }]),
            { text: 'Authorised Signatory', fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] },
            { text: CO.name, fontSize: FONT.small, color: COLORS.gray },
          ],
        },
      ],
      margin: [0, 20, 0, 0],
    });

    // Footer is passed to generateSmartPdf as a function, not pushed into content

    const pdf = await generateSmartPdf(
      content,
      buildFooter({
        leftText: `${CO.name}  ·  GSTIN ${CO.gstin}`,
        centerText: `${CO.web}  ·  ${CO.email}  ·  ${CO.phone}`,
      }),
    );

    const safeName = `${grn.grn_no}-${(supplier?.legal_name ?? 'GRN').replace(/[^A-Za-z0-9]/g, '_')}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download ? `attachment; filename="${safeName}"` : `inline; filename="${safeName}"`,
      },
    });
  } catch (err) {
    console.error('GRN PDF error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate PDF' }, { status: 500 });
  }
}
