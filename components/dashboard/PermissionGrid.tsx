'use client';

import { useMemo } from 'react';
import type { PermissionModule } from '@/lib/userPermissions.types';

/**
 * Reusable permission checkbox grid — grouped by catalogue module,
 * per-module "All" toggle, individual keys underneath. Used from both
 * the Create User and Edit User forms. Purely controlled — caller owns
 * the selected-keys set and decides when to persist.
 */
export default function PermissionGrid({
  catalogue,
  selected,
  onChange,
  disabled = false,
  hint,
}: {
  catalogue: PermissionModule[];
  /** Currently-selected permission keys. */
  selected: Set<string>;
  /** Called with a NEW Set whenever the selection changes. */
  onChange: (next: Set<string>) => void;
  /** When true, all checkboxes are disabled (e.g. for admin users). */
  disabled?: boolean;
  /** Optional helper text rendered above the grid. */
  hint?: React.ReactNode;
}) {
  const total = useMemo(() => catalogue.reduce((s, m) => s + m.permissions.length, 0), [catalogue]);
  const grantedCount = selected.size;

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    onChange(next);
  };

  const toggleModule = (keys: string[]) => {
    const allOn = keys.every(k => selected.has(k));
    const next = new Set(selected);
    if (allOn) keys.forEach(k => next.delete(k));
    else keys.forEach(k => next.add(k));
    onChange(next);
  };

  const toggleAll = () => {
    const allKeys = catalogue.flatMap(m => m.permissions.map(p => p.key));
    const next = selected.size === total ? new Set<string>() : new Set(allKeys);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {hint ? <p className="text-xs text-zinc-500">{hint}</p> : <span />}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-500">{grantedCount} of {total} granted</span>
          <button
            type="button"
            disabled={disabled}
            onClick={toggleAll}
            className="text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            {selected.size === total ? 'Clear all' : 'Grant all'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {catalogue.map(m => {
          const moduleKeys = m.permissions.map(p => p.key);
          const allOn = moduleKeys.every(k => selected.has(k));
          const someOn = moduleKeys.some(k => selected.has(k));
          return (
            <div key={m.key} className="rounded-xl border border-zinc-800 p-4 bg-black/20">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{m.label}</h3>
                  {m.description && <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>}
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={allOn}
                    ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                    onChange={() => toggleModule(moduleKeys)}
                  />
                  Grant whole module
                </label>
              </div>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                {m.permissions.map(p => (
                  <label key={p.key} className="flex items-start gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={selected.has(p.key)}
                      onChange={() => toggle(p.key)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block">{p.label}</span>
                      <span className="block text-[10px] font-mono text-zinc-600">{p.key}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
