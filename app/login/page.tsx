'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const r = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    r.replace('/dashboard');
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border border-gray-700 p-6 rounded-xl bg-black">
        <h1 className="text-xl font-semibold text-white">Login</h1>

        <input
          className="w-full border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="w-full border border-gray-600 p-2 rounded bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="w-full p-2 rounded bg-blue-600 text-white hover:bg-blue-700">Login</button>

        <a href="/register" className="block text-sm text-gray-300 underline text-center">Create account</a>
      </form>
    </main>
  );
}