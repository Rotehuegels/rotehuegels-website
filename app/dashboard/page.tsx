// app/dashboard/page.tsx

export default function Dashboard() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Rotehügels People Portal</h1>
      <p className="mt-2">Internal dashboard (authentication temporarily disabled)</p>

      <div className="mt-6 grid gap-3">
        <a className="underline" href="/api/me">Sync my Profile</a>
        <a className="underline" href="/requests/new">New Enquiry (RFP)</a>
        <a className="underline" href="/requests">My Requests</a>
        <a className="underline" href="/tickets/new">New Support Ticket</a>
        <a className="underline" href="/tickets">My Tickets</a>

        {/* HR Module */}
        <a className="underline" href="/dashboard/hr/employees">
          HR Employees
        </a>
      </div>
    </main>
  );
}	