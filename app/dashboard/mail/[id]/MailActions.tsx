'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2, FolderInput, Loader2 } from 'lucide-react';

export default function MailActions({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Move this email to Deleted Items?')) return;
    setLoading(true);
    try {
      // First get the deleted items folder id
      const fRes = await fetch('/api/mail/folders');
      const fData = await fRes.json();
      const deleted = fData.folders?.find(
        (f: { displayName: string }) => f.displayName === 'Deleted Items',
      );
      if (!deleted) throw new Error('Deleted Items folder not found');

      await fetch(`/api/mail/${emailId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationId: deleted.id }),
      });
      router.push('/dashboard/mail');
      router.refresh();
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Delete
    </button>
  );
}
