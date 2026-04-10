'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function MailListClient({
  activeFolder,
  search,
}: {
  activeFolder: string;
  search: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(search);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ folder: activeFolder });
    if (query.trim()) params.set('search', query.trim());
    router.push(`/dashboard/mail?${params}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
      <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search emails..."
        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            router.push(`/dashboard/mail?folder=${activeFolder}`);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </button>
      )}
    </form>
  );
}
