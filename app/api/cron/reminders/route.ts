import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPaymentReminder } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Weekly cron: find orders with outstanding receivables and send reminders.
export async function GET(req: Request) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find active/partial orders (not draft, completed, or cancelled)
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_no, client_email, total_value_incl_gst, status")
      .in("status", ["active", "partial", "pending"])
      .not("client_email", "is", null);

    if (error) throw error;
    if (!orders?.length) {
      return NextResponse.json({ ok: true, sent: 0, message: "No eligible orders." });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

    const results: { orderId: string; orderNo: string; status: "sent" | "skipped" | "error"; reason?: string }[] = [];

    for (const order of orders) {
      try {
        // Get total received for this order
        const { data: payments } = await supabaseAdmin
          .from("order_payments")
          .select("amount_received, payment_date")
          .eq("order_id", order.id)
          .order("payment_date", { ascending: false });

        const totalReceived = (payments ?? []).reduce(
          (s: number, p: { amount_received: number }) => s + (p.amount_received ?? 0),
          0
        );
        const pending = (order.total_value_incl_gst ?? 0) - totalReceived;

        // Skip if nothing pending
        if (pending <= 0) {
          results.push({ orderId: order.id, orderNo: order.order_no, status: "skipped", reason: "No balance due" });
          continue;
        }

        // Skip if last payment was less than 30 days ago
        const lastPaymentDate = payments?.[0]?.payment_date;
        if (lastPaymentDate && lastPaymentDate > cutoff) {
          results.push({ orderId: order.id, orderNo: order.order_no, status: "skipped", reason: "Recent payment" });
          continue;
        }

        await sendPaymentReminder(order.id);
        results.push({ orderId: order.id, orderNo: order.order_no, status: "sent" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ orderId: order.id, orderNo: order.order_no, status: "error", reason: msg });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    console.log(`[cron/reminders] Processed ${orders.length} orders, sent ${sent} reminders.`, results);

    return NextResponse.json({ ok: true, sent, total: orders.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/reminders] Failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
