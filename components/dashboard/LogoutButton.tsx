import { LogOut } from 'lucide-react';

// Plain anchor — clicking triggers a full browser navigation to the signout
// route, which clears the session server-side and 302s to /login.
// No client JS means no RSC race condition.
export default function LogoutButton() {
  return (
    <a
      href="/api/auth/signout"
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition-colors"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign out
    </a>
  );
}
