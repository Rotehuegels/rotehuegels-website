import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendRegistrationConfirmation } from '@/lib/registrationEmails';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ItemSchema = z.object({
  category_name: z.string().min(1),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
  quantity: z.number().min(1),
  unit: z.string().default('units'),
  estimated_weight_kg: z.number().optional(),
  condition: z.enum(['working', 'partially_working', 'non_working', 'damaged', 'unknown']).default('non_working'),
});

const RequestSchema = z.object({
  generator_name: z.string().min(2),
  generator_email: z.string().email(),
  generator_phone: z.string().min(10),
  generator_company: z.string().optional(),
  generator_address: z.string().min(5),
  generator_city: z.string().min(2),
  generator_state: z.string().default('Tamil Nadu'),
  generator_pincode: z.string().optional(),
  generator_type: z.enum(['individual', 'business', 'institution', 'government']).default('individual'),
  preferred_date: z.string().optional(),
  preferred_time_slot: z.enum(['morning', 'afternoon', 'evening']).optional(),
  access_instructions: z.string().optional(),
  items: z.array(ItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
  source: z.string().default('website'),
});

// GET — list all requests (admin only)
export async function GET(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabaseAdmin
    .from('collection_requests')
    .select('*, recyclers(company_name, recycler_code)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST — submit new collection request (public)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

    const d = parsed.data;

    // Generate request number: EW-YYYYMMDD-XXXX
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabaseAdmin.from('collection_requests').select('*', { count: 'exact', head: true });
    const seq = String((count ?? 0) + 1).padStart(4, '0');
    const requestNo = `EW-${today}-${seq}`;

    // Calculate estimated weight
    const estimatedWeight = d.items.reduce((s, item) => s + (item.estimated_weight_kg ?? item.quantity * 2), 0);

    // Insert request
    const { data: request, error } = await supabaseAdmin
      .from('collection_requests')
      .insert({
        request_no: requestNo,
        generator_name: d.generator_name,
        generator_email: d.generator_email,
        generator_phone: d.generator_phone,
        generator_company: d.generator_company ?? null,
        generator_address: d.generator_address,
        generator_city: d.generator_city,
        generator_state: d.generator_state,
        generator_pincode: d.generator_pincode ?? null,
        generator_type: d.generator_type,
        preferred_date: d.preferred_date ?? null,
        preferred_time_slot: d.preferred_time_slot ?? null,
        access_instructions: d.access_instructions ?? null,
        estimated_weight_kg: estimatedWeight,
        notes: d.notes ?? null,
        source: d.source,
        status: 'submitted',
      })
      .select('id, request_no')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Insert items
    const items = d.items.map(item => ({
      request_id: request.id,
      ...item,
    }));
    await supabaseAdmin.from('ewaste_collection_items').insert(items);

    // Log activity
    await supabaseAdmin.from('ewaste_activity_log').insert({
      request_id: request.id,
      action: 'status_change',
      new_value: 'submitted',
      performed_by: 'system',
      notes: `Collection request submitted by ${d.generator_name}`,
    });

    // Send confirmation email
    try {
      const nodemailer = (await import('nodemailer')).default;
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
      if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST, port: Number(SMTP_PORT), secure: false,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await transporter.sendMail({
          from: 'Rotehügels <noreply@rotehuegels.com>',
          to: d.generator_email,
          subject: `E-Waste Collection Request Received — ${requestNo} | Rotehügels`,
          html: `
            <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a;">
              <div style="border-bottom:3px solid #16a34a;padding-bottom:10px;margin-bottom:16px;">
                <div style="font-size:16px;font-weight:900;">Roteh&uuml;gels E-Waste Collection</div>
              </div>
              <p>Dear ${d.generator_name},</p>
              <p>Thank you for scheduling an e-waste collection. We've received your request.</p>
              <div style="margin:16px 0;padding:12px 16px;border:2px solid #16a34a;border-radius:6px;background:#f0fdf4;">
                <div style="font-size:10px;color:#888;text-transform:uppercase;">Tracking Number</div>
                <div style="font-size:22px;font-weight:900;color:#16a34a;margin-top:4px;">${requestNo}</div>
              </div>
              <p style="font-size:12px;color:#666;">
                <strong>Items:</strong> ${d.items.map(i => `${i.quantity} ${i.unit} ${i.category_name}`).join(', ')}<br/>
                <strong>Pickup:</strong> ${d.preferred_date ?? 'To be scheduled'} ${d.preferred_time_slot ?? ''}<br/>
                <strong>Location:</strong> ${d.generator_city}, ${d.generator_state}
              </p>
              <p style="font-size:12px;color:#666;">
                Track your request at: <a href="https://www.rotehuegels.com/ewaste/track/${request.id}" style="color:#16a34a;">rotehuegels.com/ewaste/track/${request.id}</a>
              </p>
              <div style="border-top:1px solid #ddd;padding-top:10px;margin-top:24px;font-size:9px;color:#999;">
                Rotehuegel Research Business Consultancy Pvt Ltd | noreply@rotehuegels.com<br/>
                E-waste collected responsibly and sent directly to CPCB-registered recyclers.
              </div>
            </div>
          `,
        });
      }
    } catch (e) { console.error('[ewaste/email]', e); }

    return NextResponse.json({ success: true, id: request.id, request_no: requestNo }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/ewaste/requests]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
