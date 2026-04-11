'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </button>
  );
}
