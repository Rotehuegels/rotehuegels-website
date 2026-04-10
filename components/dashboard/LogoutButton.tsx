'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors disabled:opacity-50"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
