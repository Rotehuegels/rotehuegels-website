import Link from 'next/link';
import {
  Shield, FileText, BookOpen, CheckCircle2, ArrowRight,
  Building2, Users, Briefcase, Factory, ShoppingBag, Package,
  Wallet, FolderKanban, Monitor, Award, Network,
} from 'lucide-react';
import { ALL_SOPS, DEPARTMENTS } from '@/lib/sops';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

const DEPT_ICONS: Record<string, React.ElementType> = {
  Accounts: Building2,
  'Human Resources': Users,
  Recruitment: Briefcase,
  Operations: Factory,
  Sales: ShoppingBag,
  Procurement: Package,
  Finance: Wallet,
  Projects: FolderKanban,
  IT: Monitor,
  Quality: Award,
  Network: Network,
};

const DEPT_COLORS: Record<string, string> = {
  Accounts: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  'Human Resources': 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
  Recruitment: 'from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-400',
  Operations: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400',
  Sales: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  Procurement: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  Finance: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
  Projects: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
  IT: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
  Quality: 'from-teal-500/20 to-teal-500/5 border-teal-500/20 text-teal-400',
  Network: 'from-lime-500/20 to-lime-500/5 border-lime-500/20 text-lime-400',
};

export default function IMSPage() {
  const totalSOPs = ALL_SOPS.length;
  const totalSteps = ALL_SOPS.reduce((s, sop) => s + sop.procedure.length, 0);
  const deptCounts = DEPARTMENTS.map(d => ({
    name: d,
    count: ALL_SOPS.filter(s => s.department === d).length,
  }));

  return (
    <div className="p-5 md:p-8 space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-emerald-950/30 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Integrated Management System</h1>
              <p className="text-sm text-zinc-500">ISO 9001:2015 aligned quality management framework</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'SOPs Published', value: totalSOPs, sub: `across ${DEPARTMENTS.length} departments` },
              { label: 'Procedure Steps', value: totalSteps, sub: 'documented workflows' },
              { label: 'IMS Version', value: '1.0', sub: 'effective 15 Apr 2026' },
              { label: 'System Status', value: 'Active', sub: 'next review Apr 2027', isStatus: true },
            ].map(({ label, value, sub, isStatus }) => (
              <div key={label} className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
                <p className={`text-2xl font-black ${isStatus ? 'text-emerald-400' : 'text-white'}`}>
                  {isStatus && <CheckCircle2 className="h-4 w-4 inline-block mr-1 -mt-0.5" />}
                  {value}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/d/ims/sops"
          className={`${glass} p-6 hover:border-emerald-500/30 transition-all group flex items-center justify-between`}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <FileText className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Standard Operating Procedures
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {totalSOPs} SOPs — step-by-step procedures for all ERP activities
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-700 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>

        <Link
          href="/d/documents"
          className={`${glass} p-6 hover:border-sky-500/30 transition-all group flex items-center justify-between`}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
              <BookOpen className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                Document Registry
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Controlled documents — policies, forms, records &amp; templates
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-700 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>
      </div>

      {/* Department grid */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 px-1">
          SOPs by Department
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {deptCounts.map(({ name, count }) => {
            const Icon = DEPT_ICONS[name] ?? FileText;
            const colors = DEPT_COLORS[name] ?? 'from-zinc-500/20 to-zinc-500/5 border-zinc-500/20 text-zinc-400';
            const colorParts = colors.split(' ');
            const textColor = colorParts[colorParts.length - 1]; // last class is text color

            return (
              <Link
                key={name}
                href={`/d/ims/sops?dept=${encodeURIComponent(name)}`}
                className={`rounded-xl border bg-gradient-to-b ${colors.replace(textColor, '')} p-4 hover:scale-[1.02] transition-all group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`h-5 w-5 ${textColor}`} />
                  <span className={`text-xl font-black ${textColor}`}>{count}</span>
                </div>
                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{name}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {count} SOP{count !== 1 ? 's' : ''} published
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* IMS footer info */}
      <div className={`${glass} p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="text-sm text-zinc-500">
          <span className="text-zinc-300 font-medium">Rotehügels IMS</span>
          {' '}&mdash; All SOPs follow ISO 9001:2015 structure and are subject to annual review.
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600 shrink-0">
          <span>Effective: <strong className="text-zinc-400">15 Apr 2026</strong></span>
          <span className="text-zinc-800">|</span>
          <span>Review: <strong className="text-zinc-400">15 Apr 2027</strong></span>
          <span className="text-zinc-800">|</span>
          <span>Approved by: <strong className="text-zinc-400">MR</strong></span>
        </div>
      </div>
    </div>
  );
}
