'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 text-xs text-zinc-300"
    >
      <Printer className="h-3.5 w-3.5" /> Print / Save PDF
    </button>
  );
}
