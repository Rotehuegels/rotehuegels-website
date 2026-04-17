'use client';

import dynamic from 'next/dynamic';

// Leaflet needs `window` — load only on the client after mount
const RecyclerMiniMap = dynamic(() => import('@/components/RecyclerMiniMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-zinc-900/40 rounded-xl" style={{ height: '320px' }}>
      <span className="text-xs text-zinc-500">Loading map…</span>
    </div>
  ),
});

export default RecyclerMiniMap;
