import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ── ARC Tracking Scraper ────────────────────────────────────────────────────
// ARC (Anjaney Resources & Consultancy) uses an ASP.NET form.
// We POST the consignment number and parse the tracking response.

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  remarks: string;
}

interface TrackingResult {
  carrier: string;
  tracking_no: string;
  status: string;
  origin: string;
  destination: string;
  booked_date: string;
  expected_delivery: string;
  current_status: string;
  events: TrackingEvent[];
  raw_html?: string;
  error?: string;
}

export async function GET(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trackingNo = searchParams.get('tracking_no');
  const carrier = searchParams.get('carrier') ?? 'ARC';

  if (!trackingNo) {
    return NextResponse.json({ error: 'tracking_no is required' }, { status: 400 });
  }

  try {
    let result: TrackingResult;

    switch (carrier.toUpperCase()) {
      case 'ARC':
        try {
          result = await trackARC(trackingNo);
        } catch (arcErr) {
          console.error('[ARC tracking error]', arcErr);
          result = {
            carrier: 'ARC', tracking_no: trackingNo, status: 'unknown',
            origin: '', destination: '', booked_date: '', expected_delivery: '',
            current_status: 'ARC tracking temporarily unavailable — try again later',
            events: [],
          };
        }
        break;
      default:
        result = {
          carrier, tracking_no: trackingNo, status: 'unsupported',
          origin: '', destination: '', booked_date: '', expected_delivery: '',
          current_status: 'Tracking not available for this carrier',
          events: [],
        };
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[GET /api/shipments/track]', err);
    return NextResponse.json({
      carrier: 'unknown', tracking_no: trackingNo ?? '', status: 'error',
      origin: '', destination: '', booked_date: '', expected_delivery: '',
      current_status: 'Tracking service error — try again later',
      events: [],
    });
  }
}

// ── ARC tracking implementation ─────────────────────────────────────────────

async function trackARC(trackingNo: string): Promise<TrackingResult> {
  const url = 'https://online.arclimited.com/cnstrk/cnstrk.aspx';

  // Step 1: GET the page to obtain __VIEWSTATE and __EVENTVALIDATION tokens
  const pageRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(10000),
  });
  const pageHtml = await pageRes.text();

  const viewState = extractHiddenField(pageHtml, '__VIEWSTATE');
  const eventValidation = extractHiddenField(pageHtml, '__EVENTVALIDATION');
  const viewStateGenerator = extractHiddenField(pageHtml, '__VIEWSTATEGENERATOR');

  // Step 2: POST with tracking number
  const formData = new URLSearchParams();
  formData.append('__VIEWSTATE', viewState);
  formData.append('__VIEWSTATEGENERATOR', viewStateGenerator);
  formData.append('__EVENTVALIDATION', eventValidation);
  formData.append('txtCNSMCNNO', trackingNo);
  formData.append('submit', 'Submit');

  const trackRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': url,
    },
    body: formData.toString(),
    signal: AbortSignal.timeout(10000),
  });
  const html = await trackRes.text();

  // Step 3: Parse the response HTML
  return parseARCResponse(html, trackingNo);
}

function extractHiddenField(html: string, fieldName: string): string {
  const regex = new RegExp(`id="${fieldName}"[^>]*value="([^"]*)"`, 'i');
  const match = html.match(regex);
  return match?.[1] ?? '';
}

function parseARCResponse(html: string, trackingNo: string): TrackingResult {
  const result: TrackingResult = {
    carrier: 'ARC',
    tracking_no: trackingNo,
    status: 'unknown',
    origin: '',
    destination: '',
    booked_date: '',
    expected_delivery: '',
    current_status: '',
    events: [],
  };

  // Check for error / not found
  if (html.includes('No Record Found') || html.includes('Invalid Consignment') || html.includes('Enter Consignment')) {
    result.status = 'not_found';
    result.current_status = 'No record found for this tracking number';
    return result;
  }

  // ARC returns a single table. Extract all cells.
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  const allCells: string[] = [];
  while ((match = tdRegex.exec(html)) !== null) {
    allCells.push(match[1].replace(/<[^>]*>/g, '').trim());
  }

  // ARC table structure (from real response):
  // Cell 0: "Print Date : ..."
  // Cell 1: "Associated Road Carriers Limited Consignments Tracking Details"
  // Cell 2: Origin (e.g. "VAPI")
  // Cell 3: CN No (e.g. "B4002064885")
  // Cell 4: Booking Date (e.g. "10-Apr-2026")
  // Cell 5: Destination (e.g. "MADHAVARAM-TC")
  // Cell 6: Weight (e.g. "600.00")
  // Cell 7: Delivery type (e.g. "Door Dly (With CC Attached)")
  // Cell 8: Billing status
  // Cell 9: No. of packages
  // Cell 10: Article type code
  // Cell 11+: Event date, event description, address, link — repeating

  if (allCells.length >= 6) {
    result.origin = allCells[2] ?? '';
    result.destination = allCells[5] ?? '';
    result.booked_date = allCells[4] ?? '';
  }

  // Parse tracking events: look for date patterns in cells
  // Events start after the header cells (typically after index 10)
  for (let i = 10; i < allCells.length; i++) {
    const cell = allCells[i];
    // Detect date cells (e.g. "10-Apr-2026")
    if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(cell)) {
      const eventDate = cell;
      const eventDesc = allCells[i + 1] ?? '';
      const eventAddr = allCells[i + 2] ?? '';

      if (eventDesc && !eventDesc.includes('CLICK')) {
        result.events.push({
          date: eventDate,
          time: '',
          location: eventAddr.length > 100 ? eventAddr.substring(0, 80) + '...' : eventAddr,
          status: eventDesc,
          remarks: '',
        });
      }
      i += 2; // Skip processed cells
    }
  }

  // Determine overall status from latest event
  const lastEvent = result.events[result.events.length - 1];
  if (lastEvent) {
    const statusText = lastEvent.status.toLowerCase();
    if (statusText.includes('delivered') || statusText.includes('delivery done')) {
      result.status = 'delivered';
    } else if (statusText.includes('out for delivery') || statusText.includes('loaded for delivery')) {
      result.status = 'out_for_delivery';
    } else if (statusText.includes('arrived') || statusText.includes('received at')) {
      result.status = 'in_transit';
    } else if (statusText.includes('lifted') || statusText.includes('booked') || statusText.includes('dispatched')) {
      result.status = 'in_transit';
    } else {
      result.status = 'in_transit';
    }
    result.current_status = lastEvent.status;
  } else {
    result.current_status = 'Consignment booked';
    result.status = 'booked';
  }

  // Add delivery type info
  const deliveryType = allCells[7] ?? '';
  if (deliveryType) {
    result.current_status += ` (${deliveryType})`;
  }

  return result;
}
