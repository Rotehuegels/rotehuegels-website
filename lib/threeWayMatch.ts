// ── Three-way match engine ───────────────────────────────────────────────────
// Compares an incoming purchase invoice line against:
//   1. The PO line it was ordered on (price benchmark)
//   2. The cumulative accepted GRN quantity for that PO line (quantity benchmark)
// Returns a per-line match verdict and the variances that drove it.
//
// Used by /api/accounts/purchase-invoices when an invoice is booked or edited.

export type LineMatchStatus =
  | 'pending'           // not yet evaluated
  | 'matched'           // price + qty within tolerance
  | 'price_variance'    // price out of tolerance, qty OK
  | 'qty_variance'      // qty out of tolerance, price OK
  | 'over_billed'       // invoice qty exceeds accepted GRN qty
  | 'unmatched';        // no PO line linked (off-PO purchase)

export type HeaderMatchStatus =
  | 'pending'
  | 'matched'
  | 'price_variance'
  | 'qty_variance'
  | 'over_billed'
  | 'under_billed'      // we got more than we're being billed for — rare, worth flagging
  | 'unmatched'
  | 'overridden';       // a reviewer manually accepted despite mismatch

export type Tolerances = {
  price_tolerance_pct: number;   // default 2
  qty_tolerance_pct:   number;   // default 5
};

export const DEFAULT_TOLERANCES: Tolerances = {
  price_tolerance_pct: 2,
  qty_tolerance_pct:   5,
};

export type InvoiceLineInput = {
  po_item_id: string | null;
  quantity:   number;
  unit_price: number;
};

export type POItemRef = {
  id:         string;
  quantity:   number;       // ordered qty
  unit_price: number;
};

export type GRNAggregate = {
  po_item_id:        string;
  cumulative_accepted_qty: number;   // sum of grn_items.accepted_qty grouped by po_item_id
};

export type LineVerdict = {
  match_status:        LineMatchStatus;
  variance_price_pct:  number | null;
  variance_qty_pct:    number | null;
  matched_grn_qty:     number;
};

export function matchInvoiceLine(
  line: InvoiceLineInput,
  po: POItemRef | null,
  grn: GRNAggregate | null,
  tolerances: Tolerances = DEFAULT_TOLERANCES,
): LineVerdict {
  // No PO link — call it unmatched but still capture the line.
  if (!po) {
    return { match_status: 'unmatched', variance_price_pct: null, variance_qty_pct: null, matched_grn_qty: 0 };
  }

  const pricePct = po.unit_price > 0
    ? ((line.unit_price - po.unit_price) / po.unit_price) * 100
    : 0;

  const grnQty = grn?.cumulative_accepted_qty ?? 0;

  // If we're billing for material that hasn't been received yet, that's over_billed.
  if (line.quantity > grnQty + 1e-6) {
    return {
      match_status:       'over_billed',
      variance_price_pct: round(pricePct),
      variance_qty_pct:   grnQty > 0 ? round(((line.quantity - grnQty) / grnQty) * 100) : null,
      matched_grn_qty:    grnQty,
    };
  }

  // Quantity variance vs received qty
  const qtyPct = grnQty > 0 ? ((line.quantity - grnQty) / grnQty) * 100 : 0;
  const qtyOK   = Math.abs(qtyPct)   <= tolerances.qty_tolerance_pct;
  const priceOK = Math.abs(pricePct) <= tolerances.price_tolerance_pct;

  let status: LineMatchStatus;
  if (priceOK && qtyOK) status = 'matched';
  else if (!priceOK && qtyOK) status = 'price_variance';
  else if (priceOK && !qtyOK) status = 'qty_variance';
  else status = 'price_variance';   // both fail — surface the bigger one in UI

  return {
    match_status:       status,
    variance_price_pct: round(pricePct),
    variance_qty_pct:   round(qtyPct),
    matched_grn_qty:    grnQty,
  };
}

// Roll a set of line statuses up to the header.
// Severity: unmatched > over_billed > price_variance > qty_variance > under_billed > matched > pending
export function rollupHeaderStatus(
  lineStatuses: LineMatchStatus[],
  invoiceTotal: number,
  poTotal: number | null,
): HeaderMatchStatus {
  if (lineStatuses.length === 0) return 'pending';

  const has = (s: LineMatchStatus) => lineStatuses.includes(s);
  if (has('unmatched'))      return 'unmatched';
  if (has('over_billed'))    return 'over_billed';
  if (has('price_variance')) return 'price_variance';
  if (has('qty_variance'))   return 'qty_variance';
  if (has('pending'))        return 'pending';

  // All lines matched. Check if invoice total << PO total (under-billed).
  // Useful signal so AP knows there's still PO balance left.
  if (poTotal && invoiceTotal < poTotal - 0.01) return 'under_billed';

  return 'matched';
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
