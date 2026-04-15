import { NextResponse } from 'next/server';
import { getLogoDataUrl, fmtINR, generateSmartPdf, hrLine } from '@/lib/pdfConfig';
import { COLORS, FONT, buildHeader, buildFooter, tableHeaderCell } from '@/lib/pdfTemplate';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCompanyCO } from '@/lib/company';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

function parseFY(fy: string) {
  const [startYear] = fy.split('-').map(Number);
  const endYear = startYear + 1;
  return { from: `${startYear}-04-01`, to: `${endYear}-03-31`, full: `1 April ${startYear} to 31 March ${endYear}`, label: `FY ${startYear}-${endYear}`, startYear, endYear };
}

function fyMonths(startYear: number, endYear: number) {
  const months: { year: number; month: number }[] = [];
  for (let m = 4; m <= 12; m++) months.push({ year: startYear, month: m });
  for (let m = 1; m <= 3; m++) months.push({ year: endYear, month: m });
  return months;
}

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const fy = url.searchParams.get('fy') ?? '2025-26';
  const download = url.searchParams.get('download') === '1';

  try {
    const CO = await getCompanyCO();
    const logoUrl = getLogoDataUrl();
    const { from, to, full, label, startYear, endYear } = parseFY(fy);

    const [ordersRes, expensesRes] = await Promise.all([
      supabaseAdmin.from('orders').select('order_date, cgst_amount, sgst_amount, igst_amount, status').gte('order_date', from).lte('order_date', to).neq('status', 'cancelled'),
      supabaseAdmin.from('expenses').select('expense_date, gst_input_credit').gte('expense_date', from).lte('expense_date', to),
    ]);

    const orders = ordersRes.data ?? [];
    const expenses = expensesRes.data ?? [];

    const outputByMonth: Record<string, { cgst: number; sgst: number; igst: number }> = {};
    const itcByMonth: Record<string, number> = {};
    for (const o of orders) { const k = o.order_date.slice(0, 7); if (!outputByMonth[k]) outputByMonth[k] = { cgst: 0, sgst: 0, igst: 0 }; outputByMonth[k].cgst += o.cgst_amount ?? 0; outputByMonth[k].sgst += o.sgst_amount ?? 0; outputByMonth[k].igst += o.igst_amount ?? 0; }
    for (const e of expenses) { const k = e.expense_date.slice(0, 7); itcByMonth[k] = (itcByMonth[k] ?? 0) + (e.gst_input_credit ?? 0); }

    const totalCGST = orders.reduce((s, o) => s + (o.cgst_amount ?? 0), 0);
    const totalSGST = orders.reduce((s, o) => s + (o.sgst_amount ?? 0), 0);
    const totalIGST = orders.reduce((s, o) => s + (o.igst_amount ?? 0), 0);
    const totalOutput = totalCGST + totalSGST + totalIGST;
    const totalITC = expenses.reduce((s, e) => s + (e.gst_input_credit ?? 0), 0);
    const netPayable = totalOutput - totalITC;
    const months = fyMonths(startYear, endYear);
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const content: any[] = [];

    // Header
    content.push(buildHeader({
      logoUrl,
      companyName: CO.name,
      address: `${CO.addr1} ${CO.addr2}`,
      contactLine: `${CO.email} | ${CO.phone} | ${CO.web}`,
      gstin: CO.gstin,
      pan: CO.pan,
      cin: CO.cin,
      tan: CO.tan,
      documentTitle: 'GST SUMMARY REPORT',
    }));
    content.push({ text: `For the period ${full}  |  GSTIN: ${CO.gstin}  |  All amounts in INR`, fontSize: 7.5, color: '#666', margin: [0, 0, 0, 8] });

    // Summary boxes (as table)
    content.push({
      table: {
        widths: ['*', '*', '*'],
        body: [[
          { stack: [
            { text: 'OUTPUT GST (LIABILITY)', fontSize: 7, bold: true, color: '#666' },
            { text: 'Collected from customers', fontSize: 7, color: COLORS.labelText, margin: [0, 1, 0, 3] },
            { text: fmtINR(totalOutput), fontSize: 14, bold: true, color: COLORS.sectionHeader },
            { text: `CGST: ${fmtINR(totalCGST)}  |  SGST: ${fmtINR(totalSGST)}${totalIGST > 0 ? '  |  IGST: ' + fmtINR(totalIGST) : ''}`, fontSize: 7, color: '#666', margin: [0, 3, 0, 0] },
          ]},
          { stack: [
            { text: 'INPUT TAX CREDIT (ITC)', fontSize: 7, bold: true, color: '#666' },
            { text: 'GST paid on purchases', fontSize: 7, color: COLORS.labelText, margin: [0, 1, 0, 3] },
            { text: fmtINR(totalITC), fontSize: 14, bold: true, color: COLORS.positive },
            { text: 'Offset against output liability', fontSize: 7, color: '#666', margin: [0, 3, 0, 0] },
          ]},
          { stack: [
            { text: 'NET GST PAYABLE', fontSize: 7, bold: true, color: '#666' },
            { text: 'Output GST - ITC', fontSize: 7, color: COLORS.labelText, margin: [0, 1, 0, 3] },
            { text: fmtINR(Math.abs(netPayable)), fontSize: 14, bold: true, color: netPayable > 0 ? COLORS.negative : COLORS.positive },
            { text: netPayable > 0 ? 'Payable to government' : 'ITC surplus / carry forward', fontSize: 7, color: netPayable > 0 ? COLORS.sectionHeader : COLORS.positive, margin: [0, 3, 0, 0] },
          ]},
        ]],
      },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 10, paddingRight: () => 10, paddingTop: () => 8, paddingBottom: () => 8 },
      margin: [0, 0, 0, 10],
    });

    // Monthly breakdown table
    content.push({ text: 'Monthly Breakdown', fontSize: 10, bold: true, color: COLORS.sectionHeader, margin: [0, 0, 0, 2], decoration: 'underline', decorationColor: COLORS.border });
    content.push({ text: 'Output GST by order date  |  ITC by expense date', fontSize: 7, color: COLORS.labelText, margin: [0, 0, 0, 4] });

    const monthHeader = [
      tableHeaderCell('Month', 'left'),
      tableHeaderCell('CGST', 'right'),
      tableHeaderCell('SGST', 'right'),
      tableHeaderCell('IGST', 'right'),
      tableHeaderCell('Total Output', 'right'),
      tableHeaderCell('ITC', 'right'),
      tableHeaderCell('Net Payable', 'right'),
    ];

    const monthRows = months.map(({ year, month }) => {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const out = outputByMonth[key] ?? { cgst: 0, sgst: 0, igst: 0 };
      const itc = itcByMonth[key] ?? 0;
      const totalOut = out.cgst + out.sgst + out.igst;
      const net = totalOut - itc;
      const hasActivity = totalOut > 0 || itc > 0;
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      return [
        { text: monthLabel, bold: hasActivity },
        { text: out.cgst > 0 ? fmtINR(out.cgst) : '-', alignment: 'right', color: hasActivity ? '#374151' : '#aaa' },
        { text: out.sgst > 0 ? fmtINR(out.sgst) : '-', alignment: 'right', color: hasActivity ? '#374151' : '#aaa' },
        { text: out.igst > 0 ? fmtINR(out.igst) : '-', alignment: 'right', color: hasActivity ? '#374151' : '#aaa' },
        { text: totalOut > 0 ? fmtINR(totalOut) : '-', alignment: 'right', bold: true, color: hasActivity ? COLORS.sectionHeader : '#aaa' },
        { text: itc > 0 ? fmtINR(itc) : '-', alignment: 'right', color: hasActivity ? COLORS.positive : '#aaa' },
        { text: !hasActivity ? '-' : net > 0 ? fmtINR(net) : net < 0 ? `(${fmtINR(Math.abs(net))})` : '0', alignment: 'right', bold: true, color: !hasActivity ? '#aaa' : net > 0 ? COLORS.negative : net < 0 ? COLORS.positive : '#666' },
      ];
    });

    // Totals row
    const totalRow = [
      { text: 'TOTAL', bold: true, fillColor: COLORS.headerBg },
      { text: fmtINR(totalCGST), alignment: 'right', bold: true, fillColor: COLORS.headerBg },
      { text: fmtINR(totalSGST), alignment: 'right', bold: true, fillColor: COLORS.headerBg },
      { text: totalIGST > 0 ? fmtINR(totalIGST) : '-', alignment: 'right', bold: true, fillColor: COLORS.headerBg },
      { text: fmtINR(totalOutput), alignment: 'right', bold: true, color: COLORS.sectionHeader, fillColor: COLORS.headerBg },
      { text: fmtINR(totalITC), alignment: 'right', bold: true, color: COLORS.positive, fillColor: COLORS.headerBg },
      { text: netPayable > 0 ? fmtINR(netPayable) : `(${fmtINR(Math.abs(netPayable))})`, alignment: 'right', bold: true, color: netPayable > 0 ? COLORS.negative : COLORS.positive, fillColor: COLORS.headerBg },
    ];

    content.push({
      table: { headerRows: 1, widths: [55, '*', '*', '*', '*', '*', '*'], body: [monthHeader, ...monthRows, totalRow] },
      layout: { hLineWidth: (i: number) => i <= 1 ? 1.5 : 0.5, vLineWidth: () => 0.5, hLineColor: (i: number) => i <= 1 ? '#555' : '#ddd', vLineColor: () => '#ddd', paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 },
      margin: [0, 0, 0, 8],
    });

    // Generate PDF using smart auto-scaling system
    const footer = buildFooter({
      leftText: `GSTIN: ${CO.gstin}`,
      centerText: label,
    });
    const pdfBuffer = await generateSmartPdf(content, footer);

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf', 'Cache-Control': 'public, max-age=60' };
    if (download) headers['Content-Disposition'] = `attachment; filename="GST-Report-${fy}.pdf"`;
    else headers['Content-Disposition'] = 'inline';
    return new Response(pdfBuffer, { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/gst/pdf]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'PDF generation failed' }, { status: 500 });
  }
}
