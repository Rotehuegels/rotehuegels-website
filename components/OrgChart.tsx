import Link from 'next/link';
import { Building2, Factory } from 'lucide-react';

export type CompanyNode = {
  id: string;
  slug: string;
  legal_name: string;
  trade_name?: string | null;
  is_group_holding?: boolean;
  website?: string | null;
};

export type FacilityNode = {
  id: string;
  recycler_code: string;
  company_name: string;
  unit_name?: string | null;
  state?: string | null;
  city?: string | null;
  capacity_per_month?: string | null;
  is_current?: boolean;
};

export type OrgTree = {
  /** Top-most ancestor of the current facility's company (may be the company itself). */
  root: CompanyNode;
  /** Children of the root, recursively. */
  children: OrgTreeNode[];
};

export type OrgTreeNode = {
  company: CompanyNode;
  children: OrgTreeNode[];
  facilities: FacilityNode[];
};

interface Props {
  tree: OrgTree;
  currentRecyclerId: string;
}

function CompanyBlock({ company, highlight }: { company: CompanyNode; highlight: boolean }) {
  return (
    <div className={[
      'inline-flex items-start gap-2 rounded-xl border px-3 py-2 text-left',
      highlight ? 'border-emerald-500/50 bg-emerald-500/10' :
        company.is_group_holding ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-zinc-700 bg-zinc-800/40',
    ].join(' ')}>
      <Building2 className={`h-4 w-4 mt-0.5 shrink-0 ${company.is_group_holding ? 'text-indigo-400' : 'text-zinc-400'}`} />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-white leading-tight">{company.legal_name}</div>
        {company.trade_name && company.trade_name !== company.legal_name && (
          <div className="text-[10px] text-zinc-500">{company.trade_name}</div>
        )}
        {company.is_group_holding && <div className="text-[9px] uppercase tracking-wider text-indigo-400/70 mt-0.5">Group Holding</div>}
      </div>
    </div>
  );
}

function FacilityBlock({ facility }: { facility: FacilityNode }) {
  const content = (
    <div className={[
      'inline-flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors',
      facility.is_current
        ? 'border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400/50'
        : 'border-zinc-700/80 bg-zinc-800/30 hover:border-zinc-500',
    ].join(' ')}>
      <Factory className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${facility.is_current ? 'text-emerald-400' : 'text-zinc-500'}`} />
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-white leading-tight">
          {facility.unit_name ?? facility.company_name}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">{facility.recycler_code}</div>
        {(facility.city || facility.state) && (
          <div className="text-[10px] text-zinc-500">{[facility.city, facility.state].filter(Boolean).join(', ')}</div>
        )}
      </div>
    </div>
  );
  return facility.is_current
    ? content
    : <Link href={`/d/ecosystem/${facility.recycler_code}`}>{content}</Link>;
}

function Node({ node, currentRecyclerId, depth }: { node: OrgTreeNode; currentRecyclerId: string; depth: number }) {
  return (
    <div className="flex flex-col items-center">
      <CompanyBlock company={node.company} highlight={false} />
      {(node.children.length > 0 || node.facilities.length > 0) && (
        <div className="relative mt-3 flex flex-row items-start gap-4 flex-wrap justify-center">
          {/* vertical connector from parent block */}
          <div aria-hidden className="absolute -top-3 left-1/2 h-3 w-px bg-zinc-700" />
          {/* horizontal connector across siblings */}
          {(node.children.length + node.facilities.length) > 1 && (
            <div aria-hidden className="absolute -top-0 left-8 right-8 h-px bg-zinc-700" />
          )}
          {node.children.map(child => (
            <div key={child.company.id} className="flex flex-col items-center pt-3 relative">
              <div aria-hidden className="absolute top-0 left-1/2 h-3 w-px bg-zinc-700" />
              <Node node={child} currentRecyclerId={currentRecyclerId} depth={depth + 1} />
            </div>
          ))}
          {node.facilities.map(f => (
            <div key={f.id} className="flex flex-col items-center pt-3 relative">
              <div aria-hidden className="absolute top-0 left-1/2 h-3 w-px bg-zinc-700" />
              <FacilityBlock facility={{ ...f, is_current: f.id === currentRecyclerId }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart({ tree, currentRecyclerId }: Props) {
  const totalFacilities = (function count(nodes: OrgTreeNode[]): number {
    let n = 0; for (const x of nodes) n += x.facilities.length + count(x.children); return n;
  })([{ company: tree.root, children: tree.children, facilities: [] }]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Building2 className="h-4 w-4 text-indigo-400" /> Group Structure
          <span className="text-[10px] text-zinc-500 font-normal">({totalFacilities} facilit{totalFacilities === 1 ? 'y' : 'ies'})</span>
        </h2>
      </div>
      <div className="flex justify-center min-w-fit py-2">
        <Node
          node={{ company: tree.root, children: tree.children, facilities: [] }}
          currentRecyclerId={currentRecyclerId}
          depth={0}
        />
      </div>
    </div>
  );
}
