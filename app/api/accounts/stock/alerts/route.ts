import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM = 'Rotehügels <noreply@rotehuegels.com>', EMAIL_TO = 'sivakumar@rotehuegels.com' } = process.env;

// GET — check stock levels and send alert emails for low stock items
// Can be called by a cron job or manually
export async function GET() {
  try {
    const { data: items } = await supabaseAdmin
      .from('stock_items')
      .select('id, item_name, item_code, quantity, reorder_level, reorder_qty, unit, last_alert_sent')
      .gt('reorder_level', 0);

    const lowStock = (items ?? []).filter(i => (i.quantity ?? 0) <= (i.reorder_level ?? 5));

    if (lowStock.length === 0) {
      return NextResponse.json({ message: 'All stock levels OK', alerts_sent: 0 });
    }

    // Filter out items that already had an alert in the last 24 hours
    const now = Date.now();
    const needsAlert = lowStock.filter(i => {
      if (!i.last_alert_sent) return true;
      const hoursSince = (now - new Date(i.last_alert_sent).getTime()) / (1000 * 60 * 60);
      return hoursSince >= 24;
    });

    if (needsAlert.length === 0) {
      return NextResponse.json({ message: 'Alerts already sent within 24h', low_stock_count: lowStock.length, alerts_sent: 0 });
    }

    // Send email alert
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST, port: Number(SMTP_PORT), secure: false,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      const itemRows = needsAlert.map(i =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #ddd;">${i.item_code ?? '-'}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;font-weight:700;">${i.item_name}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;color:#dc2626;font-weight:700;">${i.quantity} ${i.unit ?? ''}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${i.reorder_level}</td>
          <td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">${i.reorder_qty ?? '-'}</td>
        </tr>`
      ).join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#b45309;color:white;padding:12px 16px;font-weight:700;font-size:14px;">
            ⚠ Stock Alert — ${needsAlert.length} item${needsAlert.length > 1 ? 's' : ''} below reorder level
          </div>
          <div style="padding:16px;">
            <p style="font-size:13px;color:#555;margin-bottom:12px;">
              The following items are at or below their reorder level and need replenishment:
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Code</th>
                  <th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Item</th>
                  <th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">Current Qty</th>
                  <th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">Reorder Level</th>
                  <th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">Reorder Qty</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <p style="font-size:11px;color:#999;margin-top:12px;">
              This is an automated alert from Rotehügels ERP. Log in to <a href="https://www.rotehuegels.com/d/stock">Stock & Inventory</a> to take action.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject: `⚠ Stock Alert: ${needsAlert.length} item${needsAlert.length > 1 ? 's' : ''} below reorder level`,
        html,
        text: `Stock Alert: ${needsAlert.map(i => `${i.item_name} (${i.quantity} ${i.unit ?? ''})`).join(', ')} below reorder level.`,
      });
    }

    // Update last_alert_sent for items that were alerted
    for (const item of needsAlert) {
      await supabaseAdmin
        .from('stock_items')
        .update({ last_alert_sent: new Date().toISOString() })
        .eq('id', item.id);
    }

    return NextResponse.json({
      message: `Sent alerts for ${needsAlert.length} items`,
      low_stock_count: lowStock.length,
      alerts_sent: needsAlert.length,
      items: needsAlert.map(i => ({ name: i.item_name, qty: i.quantity, reorder_level: i.reorder_level })),
    });
  } catch (err: unknown) {
    console.error('[GET /api/accounts/stock/alerts]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Alert check failed' }, { status: 500 });
  }
}
