import { NextResponse } from 'next/server';
import { getLogoDataUrl, fmtINR, fmtDate, generateSmartPdf } from '@/lib/pdfConfig';
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

    const { data: ewb, error } = await supabaseAdmin
      .from('eway_bills')
      .select('*, orders(order_no, client_name)')
      .eq('id', id)
      .single();
    if (error || !ewb) return NextResponse.json({ error: 'EWB not found' }, { status: 404 });

    const order = ewb.orders as { order_no: string; client_name: string } | null;
    const partBFiled = Boolean(ewb.vehicle_no);

    const content: any[] = [];

    // Header
    content.push(buildHeader({
      logoUrl,
      companyName: CO.name,
      address: `${CO.addr1} ${CO.addr2}`,
      contactLine: `${CO.email}  |  ${CO.phone}  |  ${CO.web}`,
      gstin: CO.gstin,
      pan: CO.pan,
      cin: CO.cin,
      tan: CO.tan,
      documentTitle: 'E-WAY BILL',
    }));

    // EWB no + dates
    content.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto', alignment: 'right',
          stack: [
            { text: `EWB No: ${ewb.eway_bill_no ?? 'DRAFT'}`, fontSize: FONT.body, bold: true },
            { text: `Generated: ${ewb.generated_at ? new Date(ewb.generated_at).toLocaleString('en-IN') : '-'}`, fontSize: FONT.small, color: COLORS.gray },
            ...(ewb.valid_upto && partBFiled ? [{ text: `Valid Upto: ${new Date(ewb.valid_upto).toLocaleString('en-IN')}`, fontSize: FONT.small, color: COLORS.gray }] : []),
            ...(order ? [{ text: `Against Order: ${order.order_no}`, fontSize: FONT.small, color: COLORS.gray }] : []),
          ],
        },
      ],
      margin: [0, 0, 0, 8],
    });

    // Part A / Part B status strip
    content.push({
      columns: [
        {
          width: '*',
          table: {
            body: [[
              { text: 'PART A', fontSize: 7, bold: true, color: '#fff', fillColor: '#16a34a', margin: [5, 3, 5, 3], alignment: 'center' },
            ]],
          },
          layout: 'noBorders',
        },
        {
          width: '*',
          table: {
            body: [[
              {
                text: partBFiled ? 'PART B' : 'PART B — PENDING',
                fontSize: 7, bold: true, color: '#fff',
                fillColor: partBFiled ? '#16a34a' : '#f59e0b',
                margin: [5, 3, 5, 3], alignment: 'center',
              },
            ]],
          },
          layout: 'noBorders',
        },
      ],
      margin: [0, 0, 0, 10],
      columnGap: 8,
    });

    // Document details
    content.push({
      table: {
        widths: ['*', '*'],
        body: [
          [
            { stack: [
              sectionLabel('DOCUMENT'),
              { text: `${ewb.doc_type ?? '-'} : ${ewb.doc_no ?? '-'}`, fontSize: FONT.heading, bold: true },
              { text: `Date: ${fmtDate(ewb.doc_date)}`, fontSize: FONT.body, margin: [0, 2, 0, 0] },
              { text: `Type: ${ewb.supply_type ?? '-'} / ${ewb.sub_supply_type ?? '-'} / ${ewb.transaction_type ?? '-'}`, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] },
            ]},
            { stack: [
              sectionLabel('VALUE'),
              { text: fmtINR(Number(ewb.total_value ?? 0)), fontSize: FONT.heading, bold: true },
              { text: `Taxable: ${fmtINR(Number(ewb.taxable_value ?? 0))}`, fontSize: FONT.body, margin: [0, 2, 0, 0] },
              { text: `CGST ${fmtINR(Number(ewb.cgst_amount ?? 0))} · SGST ${fmtINR(Number(ewb.sgst_amount ?? 0))} · IGST ${fmtINR(Number(ewb.igst_amount ?? 0))}`, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] },
            ]},
          ],
        ],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 10],
    });

    // From / To
    content.push({
      table: {
        widths: ['*', '*'],
        body: [[
          { stack: [
            sectionLabel('BILL FROM / DISPATCH FROM'),
            { text: ewb.from_name ?? '-', fontSize: FONT.heading, bold: true },
            { text: `GSTIN: ${ewb.from_gstin ?? '-'}`, fontSize: FONT.body, margin: [0, 2, 0, 0] },
            { text: [ewb.from_address, ewb.from_place, ewb.from_pincode].filter(Boolean).join(', '), fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] },
          ]},
          { stack: [
            sectionLabel('BILL TO / SHIP TO'),
            { text: ewb.to_name ?? '-', fontSize: FONT.heading, bold: true },
            { text: `GSTIN: ${ewb.to_gstin ?? '-'}`, fontSize: FONT.body, margin: [0, 2, 0, 0] },
            { text: [ewb.to_address, ewb.to_place, ewb.to_pincode].filter(Boolean).join(', '), fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 0] },
          ]},
        ]],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 10],
    });

    // Item block
    content.push({
      table: {
        headerRows: 1,
        widths: [70, '*', 55, 55, 80, 80],
        body: [
          [
            tableHeaderCell('HSN'),
            tableHeaderCell('Description'),
            tableHeaderCell('Qty', 'right'),
            tableHeaderCell('Unit'),
            tableHeaderCell('Taxable', 'right'),
            tableHeaderCell('Total', 'right'),
          ],
          [
            { text: ewb.hsn_code ?? '-', fontSize: FONT.table, alignment: 'center' },
            { text: ewb.description ?? '-', fontSize: FONT.table },
            { text: String(Number(ewb.quantity ?? 0)), fontSize: FONT.table, alignment: 'right' },
            { text: ewb.unit ?? '-', fontSize: FONT.table, alignment: 'center' },
            { text: fmtINR(Number(ewb.taxable_value ?? 0)), fontSize: FONT.table, alignment: 'right' },
            { text: fmtINR(Number(ewb.total_value ?? 0)), fontSize: FONT.table, alignment: 'right', bold: true },
          ],
        ],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 10],
    });

    // Transport block
    content.push(sectionLabel('TRANSPORTATION'));
    content.push({
      table: {
        widths: ['*', '*', '*'],
        body: [[
          { stack: [
            { text: 'Mode', fontSize: FONT.small, color: COLORS.labelText },
            { text: ewb.transport_mode ?? '-', fontSize: FONT.body },
          ]},
          { stack: [
            { text: 'Vehicle No', fontSize: FONT.small, color: COLORS.labelText },
            { text: ewb.vehicle_no ?? 'Part B pending', fontSize: FONT.body, color: partBFiled ? COLORS.bodyText : COLORS.negative },
          ]},
          { stack: [
            { text: 'Distance', fontSize: FONT.small, color: COLORS.labelText },
            { text: ewb.distance_km ? `${ewb.distance_km} km` : '-', fontSize: FONT.body },
          ]},
        ], [
          { stack: [
            { text: 'Transporter', fontSize: FONT.small, color: COLORS.labelText },
            { text: ewb.transporter_name ?? '-', fontSize: FONT.body },
          ]},
          { stack: [
            { text: 'Transporter ID / GSTIN', fontSize: FONT.small, color: COLORS.labelText },
            { text: ewb.transporter_id ?? '-', fontSize: FONT.body },
          ]},
          { stack: [
            { text: 'Vehicle Type', fontSize: FONT.small, color: COLORS.labelText },
            { text: ewb.vehicle_type ?? '-', fontSize: FONT.body },
          ]},
        ]],
      },
      layout: TABLE_LAYOUT,
      margin: [0, 2, 0, 10],
    });

    // Notes
    if (ewb.notes) {
      content.push(sectionLabel('NOTES'));
      content.push({ text: ewb.notes, fontSize: FONT.small, color: COLORS.gray, margin: [0, 2, 0, 10], lineHeight: 1.3 });
    }

    // Disclaimer
    content.push({
      text: [
        { text: 'Internal copy. ', bold: true },
        'The authoritative e-Way Bill is the Part A Slip generated from ewaybillgst.gov.in. This document reproduces the same data for internal records / customer + transporter sharing. Validity begins from the time Part B is entered on the portal and runs 1 day per 200 km for regular vehicles.',
      ],
      fontSize: FONT.small, color: COLORS.medGray, italics: true,
      margin: [0, 8, 0, 0],
    });

    const pdf = await generateSmartPdf(
      content,
      buildFooter({
        leftText: `${CO.name}  ·  GSTIN ${CO.gstin}`,
        centerText: `${CO.web}  ·  ${CO.email}  ·  ${CO.phone}`,
      }),
    );

    const safeName = `EWB-${ewb.eway_bill_no ?? 'draft'}-${(ewb.to_name ?? 'recipient').replace(/[^A-Za-z0-9]/g, '_')}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': download ? `attachment; filename="${safeName}"` : `inline; filename="${safeName}"`,
      },
    });
  } catch (err) {
    console.error('EWB PDF error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate PDF' }, { status: 500 });
  }
}
