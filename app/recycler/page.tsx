'use client';

import { useState } from 'react';
import { Factory, ArrowRight, Loader2 } from 'lucide-react';

const input = 'w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50';

export default function RecyclerLoginPage() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/ewaste/recyclers/verify?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      // Redirect to recycler dashboard
      window.location.href = `/recycler/${data.id}`;
    } catch { setError('Connection failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Factory className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recycler Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your e-waste collection assignments</p>
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Recycler Code</label>
            <input className={input} placeholder="RCY-001" required value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Registered Email</label>
            <input type="email" className={input} placeholder="contact@recycler.com" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Access Portal
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-6">
          Not a registered recycler? Contact us at procurements@rotehuegels.com
        </p>
      </div>
    </div>
  );
}
