'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import { useHasPermission } from './auth/PermissionsProvider';

interface Props {
  endpoint: string;          // e.g. /api/accounts/suppliers/abc-123
  isActive: boolean;
  entityLabel: string;       // shown in confirm
  onChanged?: () => void;
  /** Permission key required to see this toggle. e.g. "procurement.delete".
   *  Admins always pass. Pass undefined to skip the gate. */
  permission?: string;
}

export default function ActiveToggle({ endpoint, isActive, entityLabel, onChanged, permission }: Props) {
  // All hooks must be called unconditionally before any early return.
  const allowed = useHasPermission(permission);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!allowed) return null;

  async function toggle() {
    if (isActive) {
      if (!confirm(`Deactivate ${entityLabel}? It will be hidden from new pickers but historical references stay intact. You can reactivate later.`)) return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Update failed.');
      }
      onChanged?.();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  const loading = busy || pending;
  const Icon = loading ? Loader2 : isActive ? PowerOff : Power;
  const label = isActive ? 'Deactivate' : 'Reactivate';
  const cls = isActive
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20';

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${cls}`}
      >
        <Icon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        {label}
      </button>
      {error && <span className="ml-2 text-xs text-red-400">{error}</span>}
    </>
  );
}
