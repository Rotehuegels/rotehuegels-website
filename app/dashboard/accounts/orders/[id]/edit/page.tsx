import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditOrderForm from './EditOrderForm';

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) notFound();

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href={`/d/orders/${id}`}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {order.order_no}
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Order</h1>
        <p className="mt-1 text-sm text-zinc-400 font-mono text-amber-400/70">{order.order_no} — {order.client_name}</p>
      </div>
      <EditOrderForm order={order} />
    </div>
  );
}
