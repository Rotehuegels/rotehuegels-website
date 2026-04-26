'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, Ban, ArrowRight, Loader2 } from 'lucide-react';

export default function IndentActions({
  indentId, status, hasSupplier,
}: {
  indentId: string;
  status: string;
  hasSupplier: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr]   = useState('');

  async function patchAction(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action); setErr('');
    const res = await fetch(`/api/indents/${indentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    router.refresh();
  }

  async function convertToPO() {
    if (!hasSupplier) {
      const sid = window.prompt('No preferred supplier set on this indent. Paste a supplier UUID (from /d/suppliers) to convert with:');
      if (!sid) return;
      await convertWith(sid);
      return;
    }
    await convertWith();
  }

  async function convertWith(supplierId?: string) {
    setBusy('convert'); setErr('');
    const res = await fetch(`/api/indents/${indentId}/convert-to-po`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierId ? { supplier_id: supplierId } : {}),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return; }
    router.push(`/d/purchase-orders`);
  }

  async function reject() {
    const reason = window.prompt('Rejection reason (required):');
    if (!reason) return;
    await patchAction('reject', { rejected_reason: reason });
  }

  async function cancel() {
    if (!window.confirm('Cancel this indent? It cannot be reopened.')) return;
    await patchAction('cancel');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === 'draft' && (
          <Btn icon={Send} label="Submit for approval" busy={busy === 'submit'} onClick={() => patchAction('submit')} primary />
        )}
        {status === 'submitted' && (
          <>
            <Btn icon={CheckCircle2} label="Approve" busy={busy === 'approve'} onClick={() => patchAction('approve')} tone="emerald" />
            <Btn icon={XCircle}      label="Reject"  busy={busy === 'reject'}  onClick={reject} tone="rose" />
          </>
        )}
        {status === 'approved' && (
          <Btn icon={ArrowRight} label="Convert to PO" busy={busy === 'convert'} onClick={convertToPO} primary />
        )}
        {(status === 'draft' || status === 'submitted' || status === 'approved') && (
          <Btn icon={Ban} label="Cancel" busy={busy === 'cancel'} onClick={cancel} tone="zinc" />
        )}
        {status === 'converted' && (
          <p className="text-xs text-zinc-500 italic px-2 py-2">Converted to PO — see linked PO below.</p>
        )}
      </div>
      {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{err}</div>}
    </div>
  );
}

function Btn({
  icon: Icon, label, busy, onClick, primary, tone,
}: {
  icon: React.ElementType;
  label: string;
  busy: boolean;
  onClick: () => void;
  primary?: boolean;
  tone?: 'emerald' | 'rose' | 'zinc';
}) {
  const cls = primary
    ? 'bg-rose-600 hover:bg-rose-500 text-white'
    : tone === 'emerald'
    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
    : tone === 'rose'
    ? 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
    : 'border border-zinc-700 hover:border-zinc-500 text-zinc-300';
  return (
    <button onClick={onClick} disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
