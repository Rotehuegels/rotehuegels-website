import Link from 'next/link';
import {
  LayoutDashboard, Wallet, Users, ShoppingCart, Package, FileCheck, BarChart3,
  Receipt, Briefcase, ArrowRight, CheckCircle2,
} from 'lucide-react';
import JsonLd, { softwareSchema, breadcrumbSchema } from '@/components/JsonLd';

const DESCRIPTION =
  'Operon is a full SaaS ERP — accounts, HR, payroll, procurement, inventory, sales, and statutory compliance — with production and consumption data flowing in directly from AutoREX. No duplicate entry, no reconciliation gap.';

export const metadata = {
  title: 'Operon — Industrial ERP · Rotehügels',
  description: DESCRIPTION,
  alternates: { canonical: '/digital-solutions/operon' },
  openGraph: {
    title: 'Operon — Industrial ERP',
    description: DESCRIPTION,
    url: 'https://www.rotehuegels.com/digital-solutions/operon',
    type: 'website',
  },
};

export default function OperonPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={softwareSchema({
        name: 'Operon',
        description: DESCRIPTION,
        path: '/digital-solutions/operon',
        category: 'BusinessApplication',
        subCategory: 'Enterprise Resource Planning',
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'AutoREX', path: '/digital-solutions' },
        { name: 'Operon', path: '/digital-solutions/operon' },
      ])} />

      <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-16 space-y-20">

        {/* Hero */}
        <section className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-2xl border border-sky-500/30 bg-black/50 p-4">
              <LayoutDashboard className="h-12 w-12 text-sky-400" />
            </div>
          </div>
          <p className="text-xs tracking-widest text-sky-400/90 uppercase mb-3">AutoREX Suite · Business Layer</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Operon — <span className="text-sky-400">the ERP that actually knows your plant.</span>
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-zinc-300 text-base md:text-lg leading-relaxed">
            A full SaaS ERP covering accounts, HR, payroll, procurement, inventory, sales, and statutory
            compliance — built for industrial operations. When paired with AutoREX, production and
            consumption data flow in live, so your ledger reflects the plant, not a spreadsheet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-sky-500 hover:bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition-colors inline-flex items-center gap-2">
              Request a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/digital-solutions" className="rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              Back to the suite overview
            </Link>
          </div>
        </section>

        {/* Modules */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Modules covered out of the box</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              One platform, one identity layer, one audit trail — across the whole business.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Module icon={Wallet} title="Accounts & Finance"
              body="Ledger, accounts receivable/payable, bank reconciliation, P&L, trial balance, cash-flow statements. Multi-entity, multi-currency, with full audit trail." />
            <Module icon={FileCheck} title="GST & Compliance"
              body="GSTR-1 / GSTR-3B generation, e-way bills, e-invoicing, TDS reconciliation, and automated GST filing. Built for Indian statutory requirements out of the box." />
            <Module icon={Users} title="HR & Payroll"
              body="Employee master, attendance, leave, monthly payroll with PF/ESI/PT/TDS. Integrated ATS for recruitment. Mobile PWA for employees." />
            <Module icon={ShoppingCart} title="Procurement"
              body="Supplier management, purchase orders, goods-receipt notes, re-invoice workflows, shipment tracking, and stock-in / stock-out reconciliation." />
            <Module icon={Package} title="Inventory & Stock"
              body="Multi-location stock with batch and serial tracking, costing methods (FIFO / WAC), stock valuation, and low-stock alerts tied to reorder policies." />
            <Module icon={Receipt} title="Sales & CRM"
              body="Customer master, leads, quotes, orders, recurring-order schedules, invoicing, payment receipts, and customer ledger. Customer portal included." />
            <Module icon={Briefcase} title="Project Management"
              body="Project and contract workspaces, milestone tracking, project costing, and integration with procurement and finance modules." />
            <Module icon={BarChart3} title="Reporting & Analytics"
              body="Live dashboards for sales, cash flow, inventory turns, and production cost — with production data wired in from AutoREX for per-tonne cost visibility." />
            <Module icon={LayoutDashboard} title="Client & Supplier Portals"
              body="Self-service portals for customers (orders, invoices, statements) and suppliers (POs, GRNs, payments) — branded, permissioned, and audit-logged." />
          </div>
        </section>

        {/* Why */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs tracking-widest text-sky-400/90 uppercase mb-3">Why Operon</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">A generic ERP can't see the plant. Operon can.</h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Most ERPs treat manufacturing as a data-entry task — operators type in production numbers,
                procurement reconciles against supplier invoices, and finance closes the month based on
                what was typed correctly.
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                When Operon is paired with AutoREX, production, consumption, and energy data flow into
                the ledger automatically. Shop-floor reality and the books stay aligned — every shift,
                every batch, every tonne.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-zinc-300">
              {[
                'Production data ingested live — no month-end typing',
                'Energy and utility consumption tied directly to per-tonne product cost',
                'Inventory auto-updates from weighbridge, silo sensors, and batch records',
                'Quality control tickets (LabREX) block shipments through Operon sales workflows',
                'GST, e-way bill, and e-invoice generation aligned to actual dispatch events',
                'One login, one permission model — across AutoREX, Operon, LabREX',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Deploy modes */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Deploy the way that fits</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-zinc-400">
              Three standard engagement models — pick based on team size, complexity, and compliance needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Deploy tier="Operon Starter"
              best="Small teams (under 25 employees) needing a single connected ERP fast."
              scope="Core finance, HR, sales, procurement. Cloud-hosted. Shared-tenant. Go-live in 2–4 weeks." />
            <Deploy tier="Operon Plant"
              best="Operating plants ready to connect shop-floor data to the ledger."
              scope="Full Operon + AutoREX edge node + LabREX LIMS. Dedicated-tenant. Go-live in 8–12 weeks."
              highlight />
            <Deploy tier="Operon Group"
              best="Multi-plant or multi-entity groups needing consolidation across sites."
              scope="Consolidation layer, cross-plant reporting, shared supplier master. Deployment scoped per engagement." />
          </div>
        </section>

        {/* Suite callout */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <p className="text-xs tracking-widest text-sky-400/90 uppercase mb-3 text-center">Part of the AutoREX suite</p>
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">Operon is strong. Connected, it's unbeatable.</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/digital-solutions/autorex" className="rounded-xl border border-zinc-800 bg-black/30 p-5 hover:border-red-500/40 transition-colors group no-underline">
              <p className="text-[10px] uppercase tracking-widest text-red-400/80 mb-1">AutoREX · Process Automation</p>
              <h3 className="text-base font-semibold text-white mb-1">Live plant data into your ledger.</h3>
              <p className="text-sm text-zinc-400">Production, energy, and downtime flow directly into Operon — no data-entry lag.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-red-400 group-hover:text-red-300">Explore AutoREX <ArrowRight className="h-3 w-3" /></span>
            </Link>
            <Link href="/digital-solutions/labrex" className="rounded-xl border border-zinc-800 bg-black/30 p-5 hover:border-emerald-500/40 transition-colors group no-underline">
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-1">LabREX · LIMS</p>
              <h3 className="text-base font-semibold text-white mb-1">Quality tickets block dispatches.</h3>
              <p className="text-sm text-zinc-400">LabREX sample results gate Operon sales workflows automatically.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 group-hover:text-emerald-300">Explore LabREX <ArrowRight className="h-3 w-3" /></span>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-10 md:p-12 text-center">
          <LayoutDashboard className="h-10 w-10 text-sky-400 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Move your operations onto Operon.</h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-300 mb-6">
            Tell us the shape of your operation — entities, geographies, team size, and current ERP (if any).
            We will return a deployment scope and timeline inside a week.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Request a demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/digital-solutions" className="inline-flex items-center rounded-xl border border-zinc-700 hover:border-zinc-500 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors">
              See the full AutoREX suite
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

function Module({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-sky-500/40 transition-colors">
      <Icon className="h-7 w-7 text-sky-400 mb-3" />
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}

function Deploy({ tier, best, scope, highlight }: { tier: string; best: string; scope: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? 'border-sky-500/40 bg-sky-500/5' : 'border-zinc-800 bg-zinc-900/40'}`}>
      <h3 className="text-lg font-semibold mb-2">{tier}</h3>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Best when</p>
      <p className="text-sm text-zinc-300 mb-4">{best}</p>
      <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Scope</p>
      <p className="text-sm text-zinc-400">{scope}</p>
    </div>
  );
}
