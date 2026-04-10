'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface DeleteButtonProps {
  entityName: string;
  entityLabel: string;
  deleteUrl: string;
  redirectUrl: string;
  /** HTTP method: defaults to DELETE */
  method?: string;
  /** Additional class names for the outer button */
  className?: string;
}

export default function DeleteButton({
  entityName,
  entityLabel,
  deleteUrl,
  redirectUrl,
  method = 'DELETE',
  className,
}: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(deleteUrl, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Delete failed.');
      }
      router.push(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={deleting}
        className={className ?? 'flex items-center gap-2 rounded-xl border border-red-600/40 bg-red-600/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/20 hover:border-red-500/60 disabled:opacity-50 transition-colors'}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {deleting ? 'Deleting...' : 'Delete'}
      </button>

      {error && (
        <span className="text-xs text-red-400 ml-2">{error}</span>
      )}

      {open && (
        <DeleteConfirmDialog
          entityName={entityName}
          entityLabel={entityLabel}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
