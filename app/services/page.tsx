import Link from 'next/link'
export const metadata = { title: 'Services — Rotehuegels' }

export default function ServicesPage(){
  const items = [
    { title:'Research', href:'/services/research', points:[
      'Hydrometallurgy R&D (chalcopyrite, mixed/lean ores, battery black mass, NdFeB)',
      'Pilot design & scale-up (bench → pilot → demo; M&E balance; PFD/P&ID support)',
      'Process modeling & simulation (LIX systems, kinetics, speciation, RTD)',
      'Analytical methods & SOPs (AAS/AES/ICP; QA/QC)',
      'Environmental & circularity (effluent treatment, reagent recycling, LCA snapshots)',
    ]},
    { title:'Business', href:'/services/business', points:[
      'Techno‑economic analysis (OPEX/CAPEX, sensitivity)',
      'Market entry (India focus), vendor development, policy/incentives',
      'Investor collateral (decks, data rooms)',
      'Procurement strategy (long‑lead items, EPC/EPCM bids, incoterms)',
      'Policy & compliance watch (Ministry of Mines, DGFT, BIS)',
    ]},
    { title:'Consultancy', href:'/services/consultancy', points:[
      'Plant commissioning & ramp‑up (flotation, leach, SX‑EW)',
      'Troubleshooting (phase disengagement, crud, raffinate pH, tank hydraulics)',
      'Training & SOPs (workforce upskilling, safety & risk management)',
      'Audits (process health, reagent/energy efficiency, maintenance)',
      'Remote operations & dashboards (KPIs, exception alerts)',
    ]},
  ]
  return (
    <section className="container mt-10">
      <h1>Services</h1>
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {items.map(s => (
          <div key={s.title} className="card">
            <h3>{s.title}</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1 opacity-90">
              {s.points.map(p=>(<li key={p}>{p}</li>))}
            </ul>
            <Link href={s.href} className="btn-primary inline-block mt-4 no-underline">Learn more</Link>
          </div>
        ))}
      </div>
    </section>
  )
}
