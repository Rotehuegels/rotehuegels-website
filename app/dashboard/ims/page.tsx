import Link from 'next/link';
import { Shield, FileText, BookOpen, ClipboardList, CheckCircle2 } from 'lucide-react';
import { ALL_SOPS, DEPARTMENTS } from '@/lib/sops';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

export default function IMSPage() {
  const totalSOPs = ALL_SOPS.length;
  const deptCounts = DEPARTMENTS.map(d => ({
    name: d,
    count: ALL_SOPS.filter(s => s.department === d).length,
  }));

  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Integrated Management System</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            ISO 9001:2015 aligned — Standard Operating Procedures &amp; Document Control
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total SOPs', value: totalSOPs, color: 'text-white', icon: FileText },
          { label: 'Departments', value: DEPARTMENTS.length, color: 'text-emerald-400', icon: BookOpen },
          { label: 'Version', value: '1.0', color: 'text-amber-400', icon: ClipboardList },
          { label: 'Status', value: 'Active', color: 'text-sky-400', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`${glass} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5 text-zinc-600" />
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
            <p className={`text-lg font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/d/ims/sops" className={`${glass} p-6 hover:border-emerald-500/30 transition-colors group`}>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-bold text-white">Standard Operating Procedures</h2>
          </div>
          <p className="text-sm text-zinc-400">
            {totalSOPs} SOPs across {DEPARTMENTS.length} departments — step-by-step procedures for all ERP activities
          </p>
        </Link>

        <Link href="/d/documents" className={`${glass} p-6 hover:border-sky-500/30 transition-colors group`}>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-bold text-white">Document Registry</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Controlled documents — policies, forms, records, and external documents (ISO 9001:2015 §7.5)
          </p>
        </Link>
      </div>

      {/* Department Breakdown */}
      <div className={glass}>
        <div className="px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-white">SOPs by Department</h2>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {deptCounts.map(({ name, count }) => (
            <Link
              key={name}
              href={`/d/ims/sops?dept=${encodeURIComponent(name)}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-800/20 transition-colors"
            >
              <span className="text-sm text-zinc-300">{name}</span>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                {count} SOP{count !== 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* IMS Info */}
      <div className={`${glass} p-6`}>
        <h3 className="text-sm font-semibold text-white mb-3">About the IMS</h3>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            The Integrated Management System (IMS) provides a unified framework for managing all business processes
            at Rotehügels. All SOPs follow the ISO 9001:2015 structure and are subject to annual review.
          </p>
          <p>
            <strong className="text-zinc-300">Effective Date:</strong> 15 April 2026 &nbsp;|&nbsp;
            <strong className="text-zinc-300">Next Review:</strong> 15 April 2027 &nbsp;|&nbsp;
            <strong className="text-zinc-300">Approved By:</strong> Management Representative
          </p>
        </div>
      </div>
    </div>
  );
}
