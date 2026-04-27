'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, AlertCircle } from 'lucide-react';

type Supplier = { id: string; legal_name: string; trade_name: string | null; vendor_code: string | null };

const input = 'w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600';
const label = 'block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5';

export default function EditIndentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const [suppliers, setSuppliers]         = useState<Supplier[]>([]);
  const [indentNo, setIndentNo]           = useState('');
  const [department, setDepartment]       = useState('');
  const [requiredBy, setRequiredBy]       = useState('');
  const [priority, setPriority]           = useState<'low'|'normal'|'high'|'urgent'>('normal');
  const [justification, setJustification] = useState('');
  const [supplierId, setSupplierId]       = useState('');
  const [notes, setNotes]                 = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [iRes, sRes] = await Promise.all([
          fetch(`/api/indents/${id}`),
          fetch('/api/accounts/suppliers'),
        ]);
        if (!iRes.ok) throw new Error('Indent not found');
        const { data: indent } = await iRes.json();
        const { suppliers: suppList } = await sRes.json().catch(() => ({ suppliers: [] }));
        if (cancelled) return;

        // Edits are only allowed when status === 'draft'. Status transitions
        // (submit/approve/reject/cancel) happen on the detail page.
        if (indent.status !== 'draft') {
          router.replace(`/d/indents/${id}`);
          return;
        }

        setIndentNo(indent.indent_no ?? '');
        setDepartment(indent.department ?? '');
        setRequiredBy(indent.required_by ?? '');
        setPriority(indent.priority ?? 'normal');
        setJustification(indent.justification ?? '');
        setSupplierId(indent.preferred_supplier_id ?? '');
        setNotes(indent.notes ?? '');
        setSuppliers(suppList ?? []);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Failed to load indent.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  async function save() {
    setErr('');
    setSaving(true);
    try {
      const res = await fetch(`/api/indents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          department: department || undefined,
          required_by: requiredBy || undefined,
          priority,
          justification: justification || undefined,
          preferred_supplier_id: supplierId || null,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error));
      }
      router.push(`/d/indents/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-5 w-5 text-rose-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-3xl">
      <div>
        <Link href={`/d/indents/${id}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to indent
        </Link>
        <h1 className="text-2xl font-bold text-white font-mono">{indentNo}</h1>
        <p className="mt-1 text-sm text-zinc-500">Editing draft — header fields only. Line items can&apos;t be edited after creation; cancel and re-raise if needed.</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Department</label>
            <input className={input} value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Operations / Lab / Engineering" />
          </div>
          <div>
            <label className={label}>Required by</label>
            <input className={input} type="date" value={requiredBy} onChange={e => setRequiredBy(e.target.value)} />
          </div>
          <div>
            <label className={label}>Priority</label>
            <select className={input} value={priority} onChange={e => setPriority(e.target.value as 'low'|'normal'|'high'|'urgent')}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className={label}>Preferred supplier (optional)</label>
            <select className={input} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— None —</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.legal_name}{s.vendor_code ? ` (${s.vendor_code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Justification</label>
          <textarea className={input} rows={3} value={justification} onChange={e => setJustification(e.target.value)} placeholder="Why is this purchase needed?" />
        </div>
        <div>
          <label className={label}>Notes</label>
          <textarea className={input} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything else procurement should know" />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Line items aren&apos;t editable. To change qty / item / spec, cancel this indent and raise a new one.
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{err}</div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
        <Link href={`/d/indents/${id}`}
          className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors">
          Cancel
        </Link>
      </div>
    </div>
  );
}
