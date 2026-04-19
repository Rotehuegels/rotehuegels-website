import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';

async function requireUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

const CARRIER_URLS: Record<string, string> = {
  'ARC':      'https://online.arclimited.com/cnstrk/cnstrk.aspx',
  'DTDC':     'https://www.dtdc.in/tracking.asp',
  'DHL':      'https://www.dhl.com/in-en/home/tracking.html',
  'FedEx':    'https://www.fedex.com/fedextrack/',
  'BlueDart': 'https://www.bluedart.com/tracking',
  'Delhivery': 'https://www.delhivery.com/track/package/',
  'India Post': 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
  'Gati':     'https://www.gati.com/tracking/',
  'Safexpress': 'https://www.safexpress.com/trackshipment',
  'VRL':      'https://www.vrlgroup.in/track_consignment.aspx',
  'Maruti Courier': 'https://www.maruticourier.com/Tracking/tracking.aspx',
  'Professional Courier': 'https://www.tpcindia.com/track.aspx',
  'Trackon':  'https://www.trackoncourier.com/track',
  'Ecom Express': 'https://ecomexpress.in/tracking/',
  'Xpressbees': 'https://www.xpressbees.com/track',
  'Other':    '',
};

export async function GET() {
  if (!(await requireUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .select('*, tracking_data, tracking_updated_at, purchase_orders(po_no, supplier_id, suppliers(legal_name)), orders(order_no, client_name)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shipments: data ?? [], carriers: Object.keys(CARRIER_URLS) });
}

export async function POST(req: Request) {
  if (!(await requireUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .insert({
      tracking_no: body.tracking_no,
      carrier: body.carrier,
      carrier_url: CARRIER_URLS[body.carrier] || body.carrier_url || '',
      po_id: body.po_id || null,
      order_id: body.order_id || null,
      supplier_name: body.supplier_name || null,
      description: body.description || null,
      status: body.status || 'in_transit',
      ship_date: body.ship_date || null,
      expected_date: body.expected_date || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
