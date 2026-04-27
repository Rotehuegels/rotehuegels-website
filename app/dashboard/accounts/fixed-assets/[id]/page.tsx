import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building, Wrench, AlertTriangle, CheckCircle2, XCircle,
  Calendar, MapPin, Hash, ReceiptText, Truck, AlertCircle, Briefcase,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_CONFIG: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  active:       { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Active' },
  disposed:     { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',          icon: XCircle,      label: 'Disposed' },
  under_repair: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       icon: Wrench,       label: 'Under repair' },
  written_off:  { cls: 'bg-red-500/10 text-red-400 border-red-500/20',             icon: AlertTriangle, label: 'Written off' },
};

const CATEGORY_LABELS: Record<string, string> = {
  furniture: 'Furniture', equipment: 'Equipment', vehicle: 'Vehicle',
  computer: 'Computer/IT', building: 'Building', land: 'Land', other: 'Other',
};

export default async function FixedAssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: asset, error } = await supabaseAdmin
    .from('fixed_assets')
    .select('*, suppliers(id, legal_name, gstin)')
    .eq('id', id)
    .single();

  if (error || !asset) notFound();

  const supplier = asset.suppliers as { id: string; legal_name: string; gstin: string | null } | null;
  const cfg = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.active;
  const StatusIcon = cfg.icon;

  // Useful derived metrics
  const ageYears = asset.purchase_date
    ? (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    : null;
  const depPct = asset.purchase_value
    ? (Number(asset.accumulated_depreciation ?? 0) / Number(asset.purchase_value)) * 100
    : 0;
  const warrantyDaysLeft = asset.warranty_expiry
    ? Math.floor((new Date(asset.warranty_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const amcDaysLeft = asset.amc_expiry
    ? Math.floor((new Date(asset.amc_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1800px]">
      <div>
        <Link href="/d/fixed-assets"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Fixed Assets Register
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-indigo-400" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-amber-400 font-bold">{asset.asset_code}</span>
                <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {CATEGORY_LABELS[asset.category] ?? asset.category}
                {asset.location && ` · ${asset.location}`}
                {asset.department && ` · ${asset.department}`}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${cfg.cls}`}>
            <StatusIcon className="h-3.5 w-3.5" /> {cfg.label}
          </span>
        </div>
      </div>

      {/* Valuation strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Purchase value" value={fmt(Number(asset.purchase_value ?? 0))} color="text-zinc-100" />
        <Stat label="Accumulated depreciation" value={fmt(Number(asset.accumulated_depreciation ?? 0))} color="text-amber-400" sub={`${depPct.toFixed(1)}%`} />
        <Stat label="Current book value" value={fmt(Number(asset.current_book_value ?? 0))} color="text-emerald-400" />
        <Stat label="Salvage value" value={fmt(Number(asset.salvage_value ?? 0))} color="text-zinc-300" />
      </div>

      {(warrantyDaysLeft !== null && warrantyDaysLeft >= 0 && warrantyDaysLeft <= 90) && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Warranty expires in {warrantyDaysLeft} day{warrantyDaysLeft === 1 ? '' : 's'} ({fmtDate(asset.warranty_expiry)}).
        </div>
      )}
      {(amcDaysLeft !== null && amcDaysLeft >= 0 && amcDaysLeft <= 60) && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          AMC expires in {amcDaysLeft} day{amcDaysLeft === 1 ? '' : 's'} ({fmtDate(asset.amc_expiry)}).
        </div>
      )}

      {/* Two-column metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <ReceiptText className="h-4 w-4 text-sky-400" /> Acquisition
          </h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Purchase date" icon={Calendar}>{fmtDate(asset.purchase_date)} {ageYears !== null && <span className="text-zinc-500"> · {ageYears.toFixed(1)} yr</span>}</Row>
            <Row label="Invoice ref">{asset.invoice_ref ?? '—'}</Row>
            <Row label="Supplier" icon={Truck}>
              {supplier ? (
                <Link href={`/d/suppliers/${supplier.id}`} className="text-rose-400 hover:text-rose-300">{supplier.legal_name}</Link>
              ) : '—'}
              {supplier?.gstin && <span className="text-zinc-500 font-mono ml-2">{supplier.gstin}</span>}
            </Row>
            <Row label="Serial no" icon={Hash}>{asset.serial_number ?? '—'}</Row>
          </dl>
        </div>

        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Briefcase className="h-4 w-4 text-violet-400" /> Depreciation policy
          </h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Method">{asset.depreciation_method === 'wdv' ? 'Written down value' : 'Straight line'}</Row>
            <Row label="Rate">{Number(asset.depreciation_rate ?? 0)}% per year</Row>
            <Row label="Useful life">{Number(asset.useful_life_years ?? 0)} years</Row>
            <Row label="Warranty expiry" icon={Calendar}>{fmtDate(asset.warranty_expiry)}</Row>
            <Row label="AMC expiry" icon={Calendar}>{fmtDate(asset.amc_expiry)}</Row>
          </dl>
        </div>
      </div>

      {/* Disposal */}
      {asset.status === 'disposed' && (
        <div className={`${glass} p-5 border-zinc-700`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <XCircle className="h-4 w-4 text-zinc-400" /> Disposal
          </h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Disposal date">{fmtDate(asset.disposal_date)}</Row>
            <Row label="Disposal value">{fmt(Number(asset.disposal_value ?? 0))}</Row>
            <Row label="Loss / gain">
              <span className={Number(asset.disposal_value ?? 0) >= Number(asset.current_book_value ?? 0) ? 'text-emerald-400' : 'text-red-400'}>
                {fmt(Number(asset.disposal_value ?? 0) - Number(asset.current_book_value ?? 0))}
              </span>
            </Row>
          </dl>
        </div>
      )}

      {asset.description && (
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <MapPin className="h-4 w-4 text-zinc-400" /> Description
          </h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{asset.description}</p>
        </div>
      )}

      {asset.notes && (
        <div className={`${glass} p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
            <AlertCircle className="h-4 w-4 text-zinc-400" /> Notes
          </h2>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{asset.notes}</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className={`${glass} p-4`}>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-zinc-500 w-32 shrink-0 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </dt>
      <dd className="text-zinc-200">{children}</dd>
    </div>
  );
}
