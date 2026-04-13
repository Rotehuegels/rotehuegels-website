import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
        result = await trackARC(trackingNo);
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Tracking failed' },
      { status: 500 },
    );
  }
}

// ── ARC tracking implementation ─────────────────────────────────────────────

async function trackARC(trackingNo: string): Promise<TrackingResult> {
  const url = 'https://online.arclimited.com/cnstrk/cnstrk.aspx';

  // Step 1: GET the page to obtain __VIEWSTATE and __EVENTVALIDATION tokens
  const pageRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(15000),
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
  formData.append('txtCnNo', trackingNo);
  formData.append('btnTrack', 'Track');

  const trackRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': url,
    },
    body: formData.toString(),
    signal: AbortSignal.timeout(15000),
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
  if (html.includes('No Record Found') || html.includes('Invalid Consignment')) {
    result.status = 'not_found';
    result.current_status = 'No record found for this tracking number';
    return result;
  }

  // Extract summary info from label spans
  // ARC typically shows: Origin, Destination, Booking Date, Status
  const extractLabel = (id: string) => {
    const regex = new RegExp(`id="${id}"[^>]*>([^<]*)<`, 'i');
    const match = html.match(regex);
    return match?.[1]?.trim() ?? '';
  };

  // Try common ARC label IDs
  result.origin = extractLabel('lblOrigin') || extractLabel('lblFrom') || extractFromTable(html, 'Origin');
  result.destination = extractLabel('lblDestination') || extractLabel('lblTo') || extractFromTable(html, 'Destination');
  result.booked_date = extractLabel('lblBookingDate') || extractLabel('lblDate') || extractFromTable(html, 'Booking Date');
  result.current_status = extractLabel('lblStatus') || extractLabel('lblCurrentStatus') || extractFromTable(html, 'Status');

  // Extract tracking events from table rows
  // ARC tracking tables typically have: Date, Time, Location, Status, Remarks
  const tableRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let tableMatch;
  const rows: string[][] = [];
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const row = tableMatch[1];
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      // Strip HTML tags from cell content
      cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    if (cells.length >= 3) rows.push(cells);
  }

  // Filter out header rows and parse events
  for (const cells of rows) {
    // Skip if first cell looks like a header
    if (cells[0]?.toLowerCase().includes('date') || cells[0]?.toLowerCase().includes('sr')) continue;
    // Skip empty rows
    if (!cells[0] || cells.every(c => !c)) continue;

    // Try to detect if this is a tracking event row (first cell should be a date)
    if (/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(cells[0]) || /\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(cells[0])) {
      result.events.push({
        date: cells[0] ?? '',
        time: cells[1] ?? '',
        location: cells[2] ?? '',
        status: cells[3] ?? cells[2] ?? '',
        remarks: cells[4] ?? cells[3] ?? '',
      });
    }
  }

  // Determine overall status
  const lastEvent = result.events[result.events.length - 1];
  if (lastEvent) {
    const statusText = (lastEvent.status + ' ' + lastEvent.remarks).toLowerCase();
    if (statusText.includes('deliver')) result.status = 'delivered';
    else if (statusText.includes('out for delivery')) result.status = 'out_for_delivery';
    else if (statusText.includes('transit') || statusText.includes('arrived') || statusText.includes('depart')) result.status = 'in_transit';
    else if (statusText.includes('book')) result.status = 'booked';
    else result.status = 'in_transit';
  }

  if (!result.current_status && lastEvent) {
    result.current_status = `${lastEvent.status} — ${lastEvent.location}`;
  }

  // Store raw HTML for debugging (truncated)
  result.raw_html = html.substring(0, 5000);

  return result;
}

function extractFromTable(html: string, label: string): string {
  const regex = new RegExp(label + '[\\s\\S]*?<\\/t[dh]>[\\s\\S]*?<td[^>]*>([^<]*)', 'i');
  const match = html.match(regex);
  return match?.[1]?.trim() ?? '';
}
