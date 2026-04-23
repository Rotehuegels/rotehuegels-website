'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createUserAction } from '../actions';
import PermissionGrid from '@/components/dashboard/PermissionGrid';
import type { PermissionModule } from '@/lib/userPermissions.types';

const fieldCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';

export default function NewUserForm({
  copyCandidates, customers, catalogue,
}: {
  copyCandidates: { id: string; label: string }[];
  customers: { id: string; name: string }[];
  catalogue: PermissionModule[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ userId: string; copied: number; granted: number } | null>(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff' | 'client',
    customerId: '',
    copyFromId: '',
    notes: '',
  });
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password || !form.displayName) {
      setError('Email, password, and name are required.');
      return;
    }
    if (form.role === 'client' && !form.customerId) {
      setError('Pick a customer for client-role users.');
      return;
    }
    startTransition(async () => {
      const res = await createUserAction({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        phone: form.phone || undefined,
        role: form.role,
        customerId: form.role === 'client' ? form.customerId : undefined,
        notes: form.notes || undefined,
        copyRightsFromUserId: form.role === 'staff' && form.copyFromId ? form.copyFromId : null,
        grantPermissionKeys: form.role === 'staff' ? [...permissions] : [],
      });
      if (!res.ok) { setError(res.error); return; }
      setDone({ userId: res.userId, copied: res.copied, granted: res.granted });
    });
  };

  if (done) {
    const summary: string[] = [];
    if (done.copied > 0)  summary.push(`copied ${done.copied} permission${done.copied === 1 ? '' : 's'} from the source user`);
    if (done.granted > 0) summary.push(`granted ${done.granted} additional permission${done.granted === 1 ? '' : 's'} from your selection`);
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 space-y-4">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        <h2 className="text-lg font-bold">User created</h2>
        <p className="text-sm text-zinc-300">
          Account ready{summary.length ? <> — {summary.join(' and ')}.</> : '.'}
        </p>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/d/admin/users/${done.userId}`)} className="rounded-lg bg-rose-500 hover:bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
            Edit rights
          </button>
          <button onClick={() => router.push('/d/admin/users')} className="rounded-lg border border-zinc-700 hover:border-zinc-600 px-4 py-2 text-sm text-zinc-300">
            Back to users
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Display name" required>
          <input className={fieldCls} value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
        </Field>
        <Field label="Role">
          <select className={fieldCls} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as typeof form.role })}>
            <option value="staff">Staff — granular rights</option>
            <option value="admin">Admin — full access (master-login)</option>
            <option value="client">Client — portal-only, scoped to customer</option>
          </select>
        </Field>
        <Field label="Email" required>
          <input type="email" className={fieldCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" required>
          <input type="text" className={fieldCls} value={form.password} placeholder="Set a temporary password"
            onChange={e => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Phone">
          <input className={fieldCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </Field>

        {form.role === 'client' && (
          <Field label="Customer" required>
            <select className={fieldCls} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Pick a customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        {form.role === 'staff' && (
          <Field label="Copy rights from">
            <select className={fieldCls} value={form.copyFromId} onChange={e => setForm({ ...form, copyFromId: e.target.value })}>
              <option value="">No — start with zero rights</option>
              {copyCandidates.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        )}
      </div>

      <Field label="Notes (internal)">
        <textarea rows={3} className={fieldCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional note — e.g. 'Backup for the Finance team, covering for XYZ'" />
      </Field>

      {/* Rights grid — only for staff. Admin bypasses; client scoped to customer. */}
      {form.role === 'staff' && (
        <div className="border-t border-zinc-800 pt-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">Rights to grant</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Check individual permissions or whole modules below. These are added on top of anything
              copied via &ldquo;Copy rights from&rdquo; above.
            </p>
          </div>
          <PermissionGrid
            catalogue={catalogue}
            selected={permissions}
            onChange={setPermissions}
          />
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
        <button type="button" onClick={() => router.push('/d/admin/users')} className="rounded-lg border border-zinc-700 hover:border-zinc-600 px-4 py-2 text-sm text-zinc-300">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create user
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
        {label}{required && <span className="text-rose-400">*</span>}
      </span>
      {children}
    </label>
  );
}
