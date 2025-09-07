// app/services/page.tsx
import Section from "@/components/Section";

export const metadata = {
  title: "Services — Rotehügels",
  description:
    "Research, Business, and Consultancy services by Rotehügel Research Business Consultancy Private Limited.",
};

export default function ServicesPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 space-y-12 md:space-y-16">
      <h1 className="text-3xl font-bold mb-8 text-center">Services</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Research */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="font-semibold text-xl mb-4">Research</h2>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-2">
            <li>Hydrometallurgy R&D (chalcopyrite, mixed/lean ores, battery black mass, NdFeB)</li>
            <li>Pilot design & scale-up (bench → pilot → demo; M&E balance; PFD/P&ID support)</li>
            <li>Process modeling & simulation (LIX systems, kinetics, speciation, RTD)</li>
            <li>Analytical methods & SOPs (AAS/AES/ICP; QA/QC)</li>
            <li>Environmental & circularity (effluent treatment, reagent recycling, LCA snapshots)</li>
          </ul>
        </div>

        {/* Business */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="font-semibold text-xl mb-4">Business</h2>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-2">
            <li>Techno-economic analysis (OPEX/CAPEX, sensitivity)</li>
            <li>Market entry (India focus), vendor development, policy/incentives</li>
            <li>Investor collateral (decks, data rooms)</li>
            <li>Procurement strategy (long-lead items, EPC/EPCM bids, incoterms)</li>
            <li>Policy & compliance watch (Ministry of Mines, DGFT, BIS)</li>
          </ul>
        </div>

        {/* Consultancy */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="font-semibold text-xl mb-4">Consultancy</h2>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-2">
            <li>Plant commissioning & ramp-up (flotation, leach, SX–EW)</li>
            <li>Troubleshooting (phase disengagement, crud, raffinate pH, tank hydraulics)</li>
            <li>Training & SOPs (workforce upskilling, safety & risk management)</li>
            <li>Audits (process health, reagent/energy efficiency, maintenance)</li>
            <li>Remote operations & dashboards (KPIs, exception alerts)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}