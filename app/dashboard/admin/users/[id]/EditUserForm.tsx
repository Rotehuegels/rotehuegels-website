'use client';

import { useState, useTransition } from 'react';
import { Loader2, Save, Copy, KeyRound, PowerOff } from 'lucide-react';
import {
  updateUserAction,
  savePermissionsAction,
  copyRightsAction,
  resetPasswordAction,
  deactivateUserAction,
} from '../actions';
import type { PermissionModule, UserRow } from '@/lib/userPermissions.types';
import PermissionGrid from '@/components/dashboard/PermissionGrid';

const fieldCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';

export default function EditUserForm({
  user, grantedKeys, catalogue, copyCandidates, customers,
}: {
  user: UserRow;
  grantedKeys: string[];
  catalogue: PermissionModule[];
  copyCandidates: { id: string; label: string }[];
  customers: { id: string; name: string }[];
}) {
  const [profile, setProfile] = useState({
    display_name: user.display_name ?? '',
    phone: user.phone ?? '',
    role: (user.role ?? 'staff') as 'admin' | 'staff' | 'client',
    customer_id: user.customer_id ?? '',
    notes: user.notes ?? '',
    is_active: user.is_active,
  });
  const [permissions, setPermissions] = useState<Set<string>>(new Set(grantedKeys));
  const [copyFromId, setCopyFromId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, startSave] = useTransition();
  const [pendingCopy, startCopy] = useTransition();
  const [pendingReset, startReset] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const saveAll = () => {
    startSave(async () => {
      setMsg(null);
      const p1 = await updateUserAction({
        userId: user.id,
        role: profile.role,
        displayName: profile.display_name,
        phone: profile.phone || null,
        notes: profile.notes || null,
        customerId: profile.role === 'client' ? (profile.customer_id || null) : null,
        isActive: profile.is_active,
      });
      if (!p1.ok) { setMsg({ kind: 'err', text: p1.error }); return; }
      const p2 = await savePermissionsAction({ userId: user.id, keys: [...permissions] });
      if (!p2.ok) { setMsg({ kind: 'err', text: p2.error }); return; }
      setMsg({ kind: 'ok', text: 'Saved.' });
    });
  };

  const doCopy = () => {
    if (!copyFromId) return;
    startCopy(async () => {
      setMsg(null);
      const res = await copyRightsAction({ fromUserId: copyFromId, toUserId: user.id });
      if (!res.ok) { setMsg({ kind: 'err', text: res.error }); return; }
      // Merge copied permissions into local state (server did the upsert).
      setMsg({ kind: 'ok', text: `Copied ${res.copied} permission${res.copied === 1 ? '' : 's'}. Refresh to see updated checkboxes.` });
    });
  };

  const doReset = () => {
    if (!newPassword || newPassword.length < 8) {
      setMsg({ kind: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    startReset(async () => {
      setMsg(null);
      const res = await resetPasswordAction({ userId: user.id, newPassword });
      if (!res.ok) { setMsg({ kind: 'err', text: res.error }); return; }
      setNewPassword('');
      setMsg({ kind: 'ok', text: 'Password reset.' });
    });
  };

  const doDeactivate = async () => {
    if (!confirm(`Deactivate ${user.display_name ?? user.email}? They will not be able to sign in.`)) return;
    const res = await deactivateUserAction(user.id);
    if (!res.ok) setMsg({ kind: 'err', text: res.error });
    else { setProfile({ ...profile, is_active: false }); setMsg({ kind: 'ok', text: 'User deactivated.' }); }
  };

  const readOnly = profile.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Profile</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Display name">
            <input className={fieldCls} value={profile.display_name} onChange={e => setProfile({ ...profile, display_name: e.target.value })} />
          </Field>
          <Field label="Role">
            <select className={fieldCls} value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value as typeof profile.role })}>
              <option value="staff">Staff — granular rights</option>
              <option value="admin">Admin — full access</option>
              <option value="client">Client — portal-scoped</option>
            </select>
          </Field>
          <Field label="Phone">
            <input className={fieldCls} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
          </Field>
          {profile.role === 'client' && (
            <Field label="Customer">
              <select className={fieldCls} value={profile.customer_id} onChange={e => setProfile({ ...profile, customer_id: e.target.value })}>
                <option value="">Pick a customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
        </div>
        <Field label="Internal notes">
          <textarea rows={2} className={fieldCls} value={profile.notes} onChange={e => setProfile({ ...profile, notes: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={profile.is_active} onChange={e => setProfile({ ...profile, is_active: e.target.checked })} />
          Active (unchecked = cannot sign in)
        </label>
      </section>

      {/* Rights */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Rights</h2>
          {readOnly && (
            <span className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-full px-2 py-0.5">Admin — full access, permissions below don&apos;t apply</span>
          )}
        </div>

        {/* Copy rights */}
        <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Copy rights from an existing user</p>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${fieldCls} flex-1 min-w-[240px]`} value={copyFromId} onChange={e => setCopyFromId(e.target.value)}>
              <option value="">Pick a source user…</option>
              {copyCandidates.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button
              onClick={doCopy}
              disabled={pendingCopy || !copyFromId || readOnly}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white"
            >
              {pendingCopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Copy rights
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Adds the source user&apos;s rights to this user. Doesn&apos;t remove rights this user already has.
          </p>
        </div>

        <PermissionGrid
          catalogue={catalogue}
          selected={permissions}
          onChange={setPermissions}
          disabled={readOnly}
          hint={readOnly
            ? 'Admin users bypass the permission system — these checkboxes are for reference only.'
            : 'Check a whole module to grant everything, or pick individual permissions.'}
        />
      </section>

      {/* Password + Deactivate */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5" /> Reset password
          </h2>
          <input type="text" className={fieldCls} placeholder="New password (min 8 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <button
            onClick={doReset}
            disabled={pendingReset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white"
          >
            {pendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Reset
          </button>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <PowerOff className="h-3.5 w-3.5" /> Deactivate
          </h2>
          <p className="text-xs text-zinc-400">Blocks sign-in without deleting the account or its history.</p>
          <button
            onClick={doDeactivate}
            disabled={!profile.is_active}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 text-sm text-zinc-200"
          >
            <PowerOff className="h-4 w-4" />
            {profile.is_active ? 'Deactivate user' : 'Already deactivated'}
          </button>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur p-4">
        {msg
          ? <p className={`text-sm ${msg.kind === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
          : <p className="text-xs text-zinc-500">Changes save together — click Save to commit both profile and rights.</p>}
        <button
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
