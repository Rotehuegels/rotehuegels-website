import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react';
import LeadActions from './LeadActions';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    reviewed: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    qualified: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    contacted: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${colors[status] ?? 'bg-zinc-700 text-zinc-300'}`}>
      {status}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-zinc-200">{value}</p>
      </div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try supplier first, then customer
  let lead: Record<string, unknown> | null = null;
  let table: 'supplier_leads' | 'customer_leads' = 'supplier_leads';

  const { data: supplier } = await supabaseAdmin
    .from('supplier_leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (supplier) {
    lead = supplier;
    table = 'supplier_leads';
  } else {
    const { data: customer } = await supabaseAdmin
      .from('customer_leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (customer) {
      lead = customer;
      table = 'customer_leads';
    }
  }

  if (!lead) return notFound();

  const isSupplier = table === 'supplier_leads';

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/intelligence"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Market Intelligence
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{lead.company_name as string}</h1>
            <Badge status={lead.status as string} />
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isSupplier ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-500/20 text-sky-400'}`}>
              {isSupplier ? 'Supplier Lead' : 'Customer Lead'}
            </span>
          </div>
          {lead.industry ? (
            <p className="text-sm text-zinc-400">{lead.industry as string}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Confidence:</span>
          <span className={`text-lg font-bold ${
            (lead.confidence_score as number) >= 70 ? 'text-emerald-400' :
            (lead.confidence_score as number) >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {lead.confidence_score as number}%
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoRow icon={Building2} label="Contact Person" value={(lead.contact_person as string) ?? null} />
          {!isSupplier ? <InfoRow icon={Building2} label="Designation" value={(lead.designation as string) ?? null} /> : null}
          <InfoRow icon={Mail} label="Email" value={(lead.email as string) ?? null} />
          <InfoRow icon={Phone} label="Phone" value={(lead.phone as string) ?? null} />
          <InfoRow icon={Globe} label="Website" value={(lead.website as string) ?? null} />
          <InfoRow icon={Building2} label="GSTIN" value={(lead.gstin as string) ?? null} />
          <InfoRow icon={MapPin} label="Address" value={
            [lead.address, lead.city, lead.state, lead.country].filter(Boolean).join(', ') || null
          } />
        </div>
      </div>

      {/* Products / Needs */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          {isSupplier ? 'Products & Services' : 'Potential Needs'}
        </h2>
        {isSupplier && (lead.products_services as string[] | null)?.length ? (
          <div className="flex flex-wrap gap-2">
            {(lead.products_services as string[]).map((p, i) => (
              <span key={i} className="rounded-lg bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{p}</span>
            ))}
          </div>
        ) : !isSupplier && (lead.potential_needs as string[] | null)?.length ? (
          <div className="flex flex-wrap gap-2">
            {(lead.potential_needs as string[]).map((p, i) => (
              <span key={i} className="rounded-lg bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{p}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Not available</p>
        )}
        {!isSupplier && lead.estimated_value ? (
          <div className="mt-3">
            <span className="text-xs text-zinc-500">Estimated Value: </span>
            <span className="text-sm text-zinc-300 capitalize">{lead.estimated_value as string}</span>
          </div>
        ) : null}
      </div>

      {/* Relevance Notes */}
      {lead.relevance_notes ? (
        <div className={`${glass} p-6`}>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Relevance Notes</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{lead.relevance_notes as string}</p>
        </div>
      ) : null}

      {/* Source */}
      <div className={`${glass} p-6`}>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Source</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 uppercase">{lead.source_type as string}</span>
          {lead.source_url ? (
            <a
              href={lead.source_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View source page
            </a>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Found on {new Date(lead.created_at as string).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Raw Data */}
      {lead.raw_data ? (
        <details className={`${glass} p-6`}>
          <summary className="text-sm font-semibold text-zinc-400 uppercase tracking-wide cursor-pointer hover:text-zinc-300">
            Raw Extracted Data
          </summary>
          <pre className="mt-3 text-xs text-zinc-400 bg-zinc-950 rounded-xl p-4 overflow-x-auto">
            {JSON.stringify(lead.raw_data, null, 2)}
          </pre>
        </details>
      ) : null}

      {/* Actions */}
      <LeadActions id={id} table={table} currentStatus={lead.status as string} />
    </div>
  );
}
