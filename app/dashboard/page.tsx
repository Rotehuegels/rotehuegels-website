// app/dashboard/page.tsx
import { supabaseServer } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Proper Next.js redirect instead of <meta>
    redirect('/login');
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2">Welcome, {user.email}</p>

     <div className="mt-6 grid gap-3">
 	<a className="underline" href="/api/me">Sync my Profile</a>
	<a className="underline" href="/requests/new">New Enquiry (RFP)</a>
 	<a className="underline" href="/requests">My Requests</a>
 	<a className="underline" href="/tickets/new">New Support Ticket</a>
	<a className="underline" href="/tickets">My Tickets</a>
</div>
    </main>
  );
}