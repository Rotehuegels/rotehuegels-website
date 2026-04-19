import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import MiniMap from '@/components/RecyclerMiniMapClient';
import {
  Factory, ArrowLeft, MapPin, Mail, Phone, Globe, Shield, Award, CheckCircle2,
  Building2, FileText, AlertTriangle, Calendar, Package, Recycle, Battery, Users,
  Car, BatteryCharging, Zap,
} from 'lucide-react';
import OrgChart from '@/components/OrgChart';
import { buildGroupTree } from '@/lib/recyclerGroupTree';

type ContactRow = { name?: string | null; title?: string | null; department?: string | null; email?: string | null; phone?: string | null; source?: string | null; first_seen?: string | null };
type WebsiteRow = { url: string; source?: string | null; first_seen?: string | null };

export const dynamicParams = true;
export const revalidate = 300;

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';
const fmtNum = (n: number) => new Intl.NumberFormat('en-IN').format(n);
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const CATEGORY_META: Record<string, { label: string; icon: typeof Recycle; colorCls: string; tint: string }> = {
  'e-waste':       { label: 'E-Waste',                   icon: Recycle,         colorCls: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10', tint: 'from-indigo-500/10' },
  'battery':       { label: 'Battery (Hydromet)',        icon: Battery,         colorCls: 'text-amber-400 border-amber-500/30 bg-amber-500/10',    tint: 'from-amber-500/10' },
  'black-mass':    { label: 'Black Mass / Mechanical',   icon: Package,         colorCls: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',       tint: 'from-cyan-500/10' },
  'both':          { label: 'E-Waste + Battery',         icon: Recycle,         colorCls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', tint: 'from-emerald-500/10' },
  'hazardous':     { label: 'Non-Ferrous Metals',        icon: Factory,         colorCls: 'text-purple-400 border-purple-500/30 bg-purple-500/10', tint: 'from-purple-500/10' },
  'zinc-dross':    { label: 'Zinc Dross / Zinc Ash',     icon: Factory,         colorCls: 'text-orange-400 border-orange-500/30 bg-orange-500/10', tint: 'from-orange-500/10' },
  'primary-metal': { label: 'Primary Metal Producer',    icon: Factory,         colorCls: 'text-rose-400 border-rose-500/30 bg-rose-500/10',       tint: 'from-rose-500/10' },
  'ev-oem':        { label: 'EV OEM (vehicle + pack)',   icon: Car,             colorCls: 'text-lime-400 border-lime-500/30 bg-lime-500/10',       tint: 'from-lime-500/10' },
  'battery-pack':  { label: 'Battery Pack Maker',        icon: BatteryCharging, colorCls: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', tint: 'from-yellow-500/10' },
  'cell-maker':    { label: 'Li-ion Cell / CAM Maker',   icon: Zap,             colorCls: 'text-sky-400 border-sky-500/30 bg-sky-500/10',          tint: 'from-sky-500/10' },
};

function isPlaceholder(email: string | null): boolean {
  if (!email) return true;
  return /placeholder|^cpcb\.|^mrai\./i.test(email);
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  // Internal page only — block indexing so company profiles never leak into
  // search engines via the dashboard path.
  const robots = { index: false, follow: false, nocache: true };
  const { data: r } = await supabaseAdmin
    .from('recyclers')
    .select('company_name, recycler_code')
    .eq('recycler_code', code)
    .eq('is_active', true)
    .maybeSingle();
  const title = r ? `${r.company_name} — Internal` : `Recycler ${code} — Internal`;
  return { title, robots };
}

export default async function RecyclerProfilePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const { data: r, error } = await supabaseAdmin
    .from('recyclers')
    .select('*')
    .eq('recycler_code', code)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !r) notFound();

  const cat = CATEGORY_META[r.waste_type ?? ''] ?? CATEGORY_META['e-waste'];
  const CatIcon = cat.icon;

  const hasRealEmail = !isPlaceholder(r.email);
  const hasPhone = Boolean(r.phone);
  const hasWebsite = Boolean(r.website);
  const hasGps = r.latitude != null && r.longitude != null;
  const blackMassMta = r.black_mass_mta ? Number(r.black_mass_mta) : null;

  // Related facilities — same state + similar category, up to 6
  const { data: related } = await supabaseAdmin
    .from('recyclers')
    .select('recycler_code, company_name, city, state, waste_type, capacity_per_month')
    .eq('is_active', true)
    .eq('state', r.state)
    .neq('recycler_code', code)
    .limit(6);

  // Dup flag
  const dupRef = r.notes?.match(/under\s+([A-Z]+-[A-Z]+-\d+)/i)?.[1] ?? null;
  const isDup = r.notes && /\[(cross-category )?dup/i.test(r.notes);

  // Group structure — only renders if this row's company has parent, siblings, or >1 facility
  const groupTree = await buildGroupTree(r.company_id ?? null);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className={`relative bg-gradient-to-br ${cat.tint} via-zinc-950 to-zinc-950`}>
        <div className="max-w-[1800px] mx-auto px-6 pt-10 pb-8">
          <Link href="/d/recycling/recyclers" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
            <ArrowLeft className="h-3 w-3" /> Back to directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cat.colorCls}`}>
                  <CatIcon className="h-3 w-3" /> {cat.label}
                </span>
                {r.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[11px] font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
                {isDup && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 px-2.5 py-1 text-[11px] font-medium" title={r.notes}>
                    <AlertTriangle className="h-3 w-3" /> {dupRef ? `Capacity on ${dupRef}` : 'Duplicate reference'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{r.company_name}</h1>
              <p className="mt-1.5 text-sm text-zinc-400 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                {[r.city, r.state].filter(Boolean).join(', ')}
                {r.pincode ? ` · ${r.pincode}` : ''}
              </p>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 text-right">Facility Code</p>
              <p className="text-xs font-mono text-amber-400 font-bold text-right">{r.recycler_code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8 space-y-6">
        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {r.capacity_per_month && (
            <div className={`${glass} p-4`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Capacity</p>
              <p className="text-lg font-bold text-white mt-1">{r.capacity_per_month}</p>
            </div>
          )}
          {blackMassMta && (
            <div className={`${glass} p-4`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Black Mass Output</p>
              <p className="text-lg font-bold text-cyan-400 mt-1">{fmtNum(blackMassMta)} MTA</p>
            </div>
          )}
          {r.facility_type && (
            <div className={`${glass} p-4`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Facility Type</p>
              <p className="text-lg font-bold text-white mt-1 capitalize">{r.facility_type}</p>
            </div>
          )}
          {r.service_radius_km && (
            <div className={`${glass} p-4`}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Service Radius</p>
              <p className="text-lg font-bold text-white mt-1">{r.service_radius_km} km</p>
            </div>
          )}
        </div>

        {/* Group structure — only renders when the company has a parent,
            siblings or more than one facility */}
        {groupTree && <OrgChart tree={groupTree} currentRecyclerId={r.id} />}

        {/* Contact + Authorization side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${glass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Building2 className="h-4 w-4 text-emerald-400" /> Contact
            </h2>
            <dl className="space-y-3 text-sm">
              {hasRealEmail ? (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                  <a href={`mailto:${r.email}`} className="text-sky-400 hover:text-sky-300 break-all">{r.email}</a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Mail className="h-4 w-4 shrink-0" /> Email not publicly listed
                </div>
              )}
              {hasPhone ? (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                  <a href={`tel:${r.phone}`} className="text-emerald-400 hover:text-emerald-300">{r.phone}</a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="h-4 w-4 shrink-0" /> Phone not publicly listed
                </div>
              )}
              {hasWebsite && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                  <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 break-all">{r.website.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
              {r.contact_person && r.contact_person !== 'Registered Facility' && (
                <div className="flex items-start gap-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Contact Person</span>
                  <span className="text-zinc-300 text-sm">{r.contact_person}</span>
                </div>
              )}
              {r.address && (
                <div className="pt-2 border-t border-zinc-800/60">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{r.address}</p>
                </div>
              )}
            </dl>
          </div>

          <div className={`${glass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Shield className="h-4 w-4 text-sky-400" /> Authorisation & Identifiers
            </h2>
            <dl className="space-y-3 text-sm">
              {r.cpcb_registration && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">CPCB Registration</p>
                  <p className="text-zinc-200 font-mono text-xs">{r.cpcb_registration}</p>
                </div>
              )}
              {r.spcb_registration && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">SPCB Registration</p>
                  <p className="text-zinc-200 font-mono text-xs">{r.spcb_registration}</p>
                </div>
              )}
              {r.license_valid_until && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Licence Valid Until</span>
                  <span className="text-zinc-300 text-sm">{fmtDate(r.license_valid_until)}</span>
                </div>
              )}
              {r.gstin && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">GSTIN</p>
                  <p className="text-zinc-200 font-mono text-xs">{r.gstin}</p>
                </div>
              )}
              {r.cin && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">CIN</p>
                  <p className="text-zinc-200 font-mono text-xs">{r.cin}</p>
                </div>
              )}
              {hasGps && (
                <div className="pt-2 border-t border-zinc-800/60">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">GPS</p>
                  <p className="text-zinc-300 font-mono text-xs">
                    {Number(r.latitude).toFixed(4)}°N, {Number(r.longitude).toFixed(4)}°E
                  </p>
                </div>
              )}
              {!r.cpcb_registration && !r.spcb_registration && !r.gstin && !r.cin && (
                <p className="text-xs text-zinc-600 italic">No identifiers publicly listed yet.</p>
              )}
            </dl>
          </div>
        </div>

        {/* All sourced contacts — internal view. Every email/phone/person ever
            collected from MRAI, website scrapes, registries. Deduped by value. */}
        {Array.isArray(r.contacts_all) && (r.contacts_all as ContactRow[]).length > 0 && (
          <div className={`${glass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Users className="h-4 w-4 text-indigo-400" /> All Sourced Contacts
              <span className="text-[10px] text-zinc-500 font-normal">({(r.contacts_all as ContactRow[]).length} entries · internal)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/60 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="text-left font-medium px-3 py-2">Name</th>
                    <th className="text-left font-medium px-3 py-2">Title / Dept</th>
                    <th className="text-left font-medium px-3 py-2">Phone</th>
                    <th className="text-left font-medium px-3 py-2">Email</th>
                    <th className="text-left font-medium px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {(r.contacts_all as ContactRow[]).map((c, i) => (
                    <tr key={i} className="hover:bg-zinc-800/20">
                      <td className="px-3 py-2 text-zinc-200">{c.name ?? <span className="text-zinc-600">—</span>}</td>
                      <td className="px-3 py-2 text-zinc-400">{[c.title, c.department].filter(Boolean).join(' · ') || <span className="text-zinc-600">—</span>}</td>
                      <td className="px-3 py-2">
                        {c.phone ? <a href={`tel:${c.phone}`} className="text-emerald-400 hover:text-emerald-300 font-mono text-xs">{c.phone}</a> : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {c.email ? <a href={`mailto:${c.email}`} className="text-sky-400 hover:text-sky-300 text-xs break-all">{c.email}</a> : <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-zinc-500">
                        {c.source ?? '—'}
                        {c.first_seen && <span className="block text-zinc-600">{c.first_seen}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All sourced websites — a separate small list */}
        {Array.isArray(r.websites_all) && (r.websites_all as WebsiteRow[]).length > 0 && (
          <div className={`${glass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Globe className="h-4 w-4 text-violet-400" /> All Sourced Websites
              <span className="text-[10px] text-zinc-500 font-normal">({(r.websites_all as WebsiteRow[]).length} · internal)</span>
            </h2>
            <ul className="space-y-1 text-sm">
              {(r.websites_all as WebsiteRow[]).map((w, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-1">
                  <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 break-all">
                    {w.url.replace(/^https?:\/\//, '')}
                  </a>
                  <span className="text-[10px] text-zinc-500 shrink-0">{w.source ?? '—'}{w.first_seen ? ` · ${w.first_seen}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Map */}
        {hasGps && (
          <div className={`${glass} p-2 overflow-hidden`}>
            <MiniMap lat={Number(r.latitude)} lng={Number(r.longitude)} label={r.company_name} />
          </div>
        )}

        {/* Notes / description */}
        {r.notes && !isDup && (
          <div className={`${glass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <FileText className="h-4 w-4 text-amber-400" /> Description
            </h2>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{r.notes}</p>
          </div>
        )}

        {/* Capabilities */}
        {Array.isArray(r.capabilities) && r.capabilities.length > 0 && (
          <div className={`${glass} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Award className="h-4 w-4 text-emerald-400" /> Capabilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {r.capabilities.map((c: string) => (
                <span key={c} className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs text-zinc-300">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Related facilities */}
        {related && related.length > 0 && (
          <div className={`${glass} overflow-hidden`}>
            <div className="px-5 py-3 border-b border-zinc-800/60">
              <h2 className="text-sm font-semibold text-white">Other facilities in {r.state}</h2>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {related.map(o => {
                const m = CATEGORY_META[o.waste_type ?? ''] ?? CATEGORY_META['e-waste'];
                const Icon = m.icon;
                return (
                  <Link key={o.recycler_code} href={`/d/recycling/recyclers/${o.recycler_code}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${m.colorCls}`}>
                        <Icon className="h-2.5 w-2.5" /> {m.label.split(' ')[0]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-200 truncate group-hover:text-white transition-colors">{o.company_name}</p>
                        <p className="text-[11px] text-zinc-500">{o.city} · {o.recycler_code}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{o.capacity_per_month ?? '—'}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Legal disclaimer */}
        <div className="text-[11px] text-zinc-600 leading-relaxed pt-4">
          <p>
            <strong className="text-zinc-500">Disclaimer:</strong> Rotehügels operates as a digital facilitator only. The information on this page is sourced from CPCB, SPCB, MPCB, MoEF registries and publicly disclosed facility information.
            Rotehügels does not physically collect, store, handle, or transport any waste. Users are advised to independently verify the facility&apos;s credentials, authorisation validity, and operational status before engaging. Listing on this directory does not constitute endorsement.
          </p>
        </div>
      </div>
    </div>
  );
}
