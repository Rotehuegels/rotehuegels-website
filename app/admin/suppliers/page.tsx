import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const key = (searchParams?.key || "").toString();
  const adminKey = process.env.ADMIN_ACCESS_KEY || "";

  if (!adminKey || key !== adminKey) {
    return (
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-4">403 — Forbidden</h1>
        <p className="text-zinc-300">
          Invalid or missing access key. Append <code>?key=YOUR_ADMIN_ACCESS_KEY</code> to the URL.
        </p>
      </div>
    );
  }

  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="container mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <pre className="text-sm text-red-400">{error.message}</pre>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Suppliers (latest)</h1>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70 border-b border-zinc-800">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">Product/Service</th>
              <th className="text-left p-3">Certifications</th>
              <th className="text-left p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row: any) => (
              <tr key={row.id} className="border-b border-zinc-800/60">
                <td className="p-3 whitespace-nowrap">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
                </td>
                <td className="p-3">{row.company_name || "-"}</td>
                <td className="p-3">{row.contact_person || "-"}</td>
                <td className="p-3">{row.email || "-"}</td>
                <td className="p-3">{row.phone || "-"}</td>
                <td className="p-3">{row.country || "-"}</td>
                <td className="p-3">{row.product_service || row.product_categories || "-"}</td>
                <td className="p-3">{row.certifications || "-"}</td>
                <td className="p-3">{row.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-400 mt-3">
        Showing up to 200 latest records.
      </p>
    </div>
  );
}
