'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, CheckCircle2, XCircle, Ban, ArrowRight, Loader2 } from 'lucide-react';

type Modal = 'reject' | 'cancel' | 'convert-supplier' | null;

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
  const [modal, setModal] = useState<Modal>(null);
  const [modalText, setModalText] = useState('');

  function openModal(m: Modal) { setModal(m); setModalText(''); setErr(''); }
  function closeModal()        { setModal(null); setModalText(''); }

  async function patchAction(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action); setErr('');
    const res = await fetch(`/api/indents/${indentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return false; }
    router.refresh();
    return true;
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

  function onConvertClick() {
    if (hasSupplier) { void convertWith(); return; }
    openModal('convert-supplier');
  }

  async function confirmModal() {
    if (modal === 'reject') {
      const ok = await patchAction('reject', { rejected_reason: modalText.trim() });
      if (ok) closeModal();
    } else if (modal === 'cancel') {
      const ok = await patchAction('cancel');
      if (ok) closeModal();
    } else if (modal === 'convert-supplier') {
      closeModal();
      await convertWith(modalText.trim());
    }
  }

  const modalConfig = modal && {
    reject: {
      title: 'Reject Indent',
      hint: 'Explain why this indent is being rejected. The reason is recorded against the indent for audit.',
      placeholder: 'e.g. Quantity exceeds approved budget; resubmit with revised qty',
      confirmLabel: 'Reject',
      confirmTone: 'rose' as const,
      multiline: true,
      requireText: true,
    },
    cancel: {
      title: 'Cancel Indent',
      hint: 'This indent will be marked cancelled and excluded from open-demand reports. It cannot be reopened.',
      placeholder: '',
      confirmLabel: 'Cancel Indent',
      confirmTone: 'zinc' as const,
      multiline: false,
      requireText: false,
    },
    'convert-supplier': {
      title: 'Convert to PO — choose supplier',
      hint: 'No preferred supplier was set on this indent. Paste a supplier UUID (from /d/suppliers) to use for the new PO.',
      placeholder: 'Supplier UUID',
      confirmLabel: 'Convert to PO',
      confirmTone: 'rose' as const,
      multiline: false,
      requireText: true,
    },
  }[modal];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === 'draft' && (
          <Btn icon={Send} label="Submit for approval" busy={busy === 'submit'} onClick={() => patchAction('submit')} primary />
        )}
        {status === 'submitted' && (
          <>
            <Btn icon={CheckCircle2} label="Approve" busy={busy === 'approve'} onClick={() => patchAction('approve')} tone="emerald" />
            <Btn icon={XCircle}      label="Reject"  busy={busy === 'reject'}  onClick={() => openModal('reject')} tone="rose" />
          </>
        )}
        {status === 'approved' && (
          <Btn icon={ArrowRight} label="Convert to PO" busy={busy === 'convert'} onClick={onConvertClick} primary />
        )}
        {(status === 'draft' || status === 'submitted' || status === 'approved') && (
          <Btn icon={Ban} label="Cancel" busy={busy === 'cancel'} onClick={() => openModal('cancel')} tone="zinc" />
        )}
        {status === 'converted' && (
          <p className="text-xs text-zinc-500 italic px-2 py-2">Converted to PO — see linked PO below.</p>
        )}
      </div>
      {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{err}</div>}

      {modal && modalConfig && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !busy && closeModal()}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">{modalConfig.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{modalConfig.hint}</p>

            {(modalConfig.multiline || modalConfig.requireText) && (
              <>
                <label className="block mt-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {modal === 'reject' ? 'Rejection reason' : modal === 'convert-supplier' ? 'Supplier UUID' : 'Reason'}
                  {modalConfig.requireText && <span className="text-red-400"> *</span>}
                </label>
                {modalConfig.multiline ? (
                  <textarea
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    rows={4}
                    placeholder={modalConfig.placeholder}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    placeholder={modalConfig.placeholder}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
                    autoFocus
                  />
                )}
              </>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={!!busy}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal}
                disabled={!!busy || (modalConfig.requireText && !modalText.trim())}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  modalConfig.confirmTone === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                }`}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modalConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
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
