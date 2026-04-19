import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { OrgTree, OrgTreeNode, CompanyNode, FacilityNode } from '@/components/OrgChart';

type CompanyRow = {
  id: string;
  slug: string;
  legal_name: string;
  trade_name: string | null;
  parent_company_id: string | null;
  is_group_holding: boolean;
  website: string | null;
};
type FacilityRow = {
  id: string;
  recycler_code: string | null;
  company_name: string | null;
  unit_name: string | null;
  state: string | null;
  city: string | null;
  capacity_per_month: string | null;
  company_id: string | null;
};

/**
 * Build the group org-chart rooted at the ultimate ancestor of
 * `companyId`. Returns null if the company has no parent AND no siblings
 * AND no other facilities — i.e. no grouping is meaningful to render.
 */
export async function buildGroupTree(companyId: string | null | undefined): Promise<OrgTree | null> {
  if (!companyId) return null;

  // Pull ALL companies — easier than walking parents with round trips. The
  // table is small (tens of rows) even at scale.
  const { data: companies } = await supabaseAdmin
    .from('companies')
    .select('id, slug, legal_name, trade_name, parent_company_id, is_group_holding, website');
  if (!companies) return null;

  const byId = new Map<string, CompanyRow>();
  for (const c of companies as CompanyRow[]) byId.set(c.id, c);

  // Walk up to root
  let current = byId.get(companyId);
  if (!current) return null;
  while (current.parent_company_id && byId.has(current.parent_company_id)) {
    current = byId.get(current.parent_company_id)!;
  }
  const rootId = current.id;

  // Collect all descendants of root
  const descendants = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const c of byId.values()) {
      if (c.parent_company_id && descendants.has(c.parent_company_id) && !descendants.has(c.id)) {
        descendants.add(c.id);
        added = true;
      }
    }
  }

  // Only render an org chart if there's actually structure — a lone
  // company with just one facility and no parent/subsidiary isn't
  // interesting to draw.
  const structureSize = descendants.size;
  const rootCo = byId.get(rootId)!;

  // Fetch facilities under every descendant company
  const { data: facilitiesRaw } = await supabaseAdmin
    .from('recyclers')
    .select('id, recycler_code, company_name, unit_name, state, city, capacity_per_month, company_id')
    .in('company_id', [...descendants])
    .eq('is_active', true);
  const facilities = (facilitiesRaw ?? []) as FacilityRow[];

  if (structureSize === 1 && facilities.length <= 1) return null;

  // Group facilities by company_id
  const facsByCompany = new Map<string, FacilityNode[]>();
  for (const f of facilities) {
    if (!f.company_id) continue;
    const bucket = facsByCompany.get(f.company_id) ?? [];
    bucket.push({
      id: f.id,
      recycler_code: f.recycler_code ?? '?',
      company_name: f.company_name ?? '?',
      unit_name: f.unit_name,
      state: f.state,
      city: f.city,
      capacity_per_month: f.capacity_per_month,
    });
    facsByCompany.set(f.company_id, bucket);
  }

  // Build tree recursively
  function buildNode(id: string): OrgTreeNode {
    const co = byId.get(id)!;
    const childCompanies = [...byId.values()].filter(c => c.parent_company_id === id);
    const companyNode: CompanyNode = {
      id: co.id,
      slug: co.slug,
      legal_name: co.legal_name,
      trade_name: co.trade_name,
      is_group_holding: co.is_group_holding,
      website: co.website,
    };
    return {
      company: companyNode,
      children: childCompanies.map(c => buildNode(c.id)),
      facilities: facsByCompany.get(id) ?? [],
    };
  }

  const rootNode = buildNode(rootId);
  const rootCoNode: CompanyNode = {
    id: rootCo.id,
    slug: rootCo.slug,
    legal_name: rootCo.legal_name,
    trade_name: rootCo.trade_name,
    is_group_holding: rootCo.is_group_holding,
    website: rootCo.website,
  };
  return {
    root: rootCoNode,
    children: rootNode.children,
  };
}
