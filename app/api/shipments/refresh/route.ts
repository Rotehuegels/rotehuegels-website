import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Background refresh: scrape ARC, save tracking data to DB.
// Called by: Refresh button (fire-and-forget), cron job, or manual trigger.

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const cronAuth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = !!cronSecret && cronAuth === `Bearer ${cronSecret}`;
  if (!user && !isCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const shipmentId = body.shipment_id as string | undefined;

    // Get shipments to refresh
    let query = supabaseAdmin.from('shipments').select('*').not('status', 'in', '("delivered","returned")');
    if (shipmentId) query = supabaseAdmin.from('shipments').select('*').eq('id', shipmentId);

    const { data: shipments } = await query;
    if (!shipments?.length) {
      return NextResponse.json({ ok: true, refreshed: 0 });
    }

    const results: Array<{ id: string; tracking_no: string; status: string }> = [];

    for (const shipment of shipments) {
      try {
        const trackingData = await scrapeARC(shipment.tracking_no);

        // Save to DB
        const update: Record<string, unknown> = {
          tracking_data: trackingData,
          tracking_updated_at: new Date().toISOString(),
        };

        // Auto-update status if tracking shows change
        if (trackingData.status && !['unknown', 'not_found', 'error'].includes(trackingData.status)) {
          update.status = trackingData.status;
          if (trackingData.status === 'delivered') {
            update.delivered_date = new Date().toISOString().split('T')[0];
          }
        }

        await supabaseAdmin.from('shipments').update(update).eq('id', shipment.id);
        results.push({ id: shipment.id, tracking_no: shipment.tracking_no, status: trackingData.status ?? 'unknown' });
      } catch (err) {
        console.error(`[refresh] Failed for ${shipment.tracking_no}:`, err);
        results.push({ id: shipment.id, tracking_no: shipment.tracking_no, status: 'error' });
      }
    }

    return NextResponse.json({ ok: true, refreshed: results.length, results });
  } catch (err: unknown) {
    console.error('[POST /api/shipments/refresh]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Refresh failed' }, { status: 500 });
  }
}

// ── ARC Scraper ─────────────────────────────────────────────────────────────

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  remarks: string;
}

interface TrackingData {
  carrier: string;
  tracking_no: string;
  status: string;
  origin: string;
  destination: string;
  booked_date: string;
  current_status: string;
  delivery_type: string;
  weight: string;
  packages: string;
  events: TrackingEvent[];
  fetched_at: string;
}

async function scrapeARC(trackingNo: string): Promise<TrackingData> {
  const url = 'https://online.arclimited.com/cnstrk/cnstrk.aspx';

  // Step 1: GET page for ASP.NET tokens
  const pageRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(15000),
  });
  const pageHtml = await pageRes.text();

  const viewState = extractField(pageHtml, '__VIEWSTATE');
  const eventValidation = extractField(pageHtml, '__EVENTVALIDATION');
  const viewStateGenerator = extractField(pageHtml, '__VIEWSTATEGENERATOR');

  // Step 2: POST tracking number
  const form = new URLSearchParams();
  form.append('__VIEWSTATE', viewState);
  form.append('__VIEWSTATEGENERATOR', viewStateGenerator);
  form.append('__EVENTVALIDATION', eventValidation);
  form.append('txtCNSMCNNO', trackingNo);
  form.append('submit', 'Submit');

  const trackRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': url,
    },
    body: form.toString(),
    signal: AbortSignal.timeout(15000),
  });
  const html = await trackRes.text();

  return parseARC(html, trackingNo);
}

function extractField(html: string, name: string): string {
  const regex = new RegExp(`id="${name}"[^>]*value="([^"]*)"`, 'i');
  return html.match(regex)?.[1] ?? '';
}

function parseARC(html: string, trackingNo: string): TrackingData {
  const result: TrackingData = {
    carrier: 'ARC',
    tracking_no: trackingNo,
    status: 'unknown',
    origin: '',
    destination: '',
    booked_date: '',
    current_status: '',
    delivery_type: '',
    weight: '',
    packages: '',
    events: [],
    fetched_at: new Date().toISOString(),
  };

  if (html.includes('No Record Found') || html.includes('Invalid Consignment') || html.includes('Enter Consignment')) {
    result.status = 'not_found';
    result.current_status = 'No record found';
    return result;
  }

  // Extract all table cells
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  const cells: string[] = [];
  while ((match = tdRegex.exec(html)) !== null) {
    cells.push(match[1].replace(/<[^>]*>/g, '').trim());
  }

  // ARC table: [0]PrintDate [1]Title [2]Origin [3]CN [4]BookDate [5]Dest [6]Weight [7]DeliveryType [8]Billing [9]Pkgs [10]ArticleType [11+]Events
  if (cells.length >= 6) {
    result.origin = cells[2] ?? '';
    result.destination = cells[5] ?? '';
    result.booked_date = cells[4] ?? '';
    result.weight = cells[6] ?? '';
    result.delivery_type = cells[7] ?? '';
    result.packages = cells[9] ?? '';
  }

  // Parse events: date pattern cells followed by description + address
  for (let i = 10; i < cells.length; i++) {
    if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(cells[i])) {
      const desc = cells[i + 1] ?? '';
      const addr = cells[i + 2] ?? '';
      if (desc && !desc.includes('CLICK')) {
        result.events.push({
          date: cells[i],
          time: '',
          location: addr.length > 100 ? addr.substring(0, 80) + '...' : addr,
          status: desc,
          remarks: '',
        });
      }
      i += 2;
    }
  }

  // Determine status
  const last = result.events[result.events.length - 1];
  if (last) {
    const s = last.status.toLowerCase();
    if (s.includes('delivered') || s.includes('delivery done')) result.status = 'delivered';
    else if (s.includes('out for delivery') || s.includes('loaded for delivery')) result.status = 'out_for_delivery';
    else if (s.includes('arrived') || s.includes('received at')) result.status = 'in_transit';
    else result.status = 'in_transit';
    result.current_status = last.status;
  } else {
    result.current_status = 'Consignment booked';
    result.status = 'booked';
  }

  if (result.delivery_type) {
    result.current_status += ` (${result.delivery_type})`;
  }

  return result;
}
