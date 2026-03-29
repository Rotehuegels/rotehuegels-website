'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabaseBrowser().auth.signOut();
    router.replace('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign out
    </button>
  );
}
