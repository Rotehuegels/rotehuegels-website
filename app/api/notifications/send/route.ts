import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendPaymentReminder,
  sendQuoteEmail,
  sendPOConfirmation,
} from "@/lib/notifications";

export async function POST(req: Request) {
  // Auth check
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, entityId, stage, upto } = body as {
    type: string;
    entityId: string;
    stage?: number;
    upto?: number;
  };

  if (!type || !entityId) {
    return NextResponse.json(
      { error: "Missing type or entityId" },
      { status: 400 }
    );
  }

  try {
    switch (type) {
      case "order_confirmation":
        await sendOrderConfirmation(entityId, { stage, upto });
        break;
      case "payment_receipt":
        await sendPaymentReceipt(entityId);
        break;
      case "payment_reminder":
        await sendPaymentReminder(entityId);
        break;
      case "quote_email":
        await sendQuoteEmail(entityId);
        break;
      case "po_confirmation":
        await sendPOConfirmation(entityId);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[notifications] Failed to send ${type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
