export const metadata = { title: 'Research Services — Rotehuegels' }
export default function ResearchPage(){
  return (
    <section className="container mt-10">
      <h1>Research</h1>
      <p className="mt-4 opacity-90">Hydrometallurgy R&amp;D, pilot design, process modeling, analytical SOPs, and sustainability studies.</p>
      <ul className="list-disc pl-5 mt-4 space-y-2 opacity-90">
        <li>Hydrometallurgy R&amp;D (chalcopyrite, mixed/lean ores, battery black mass, NdFeB)</li>
        <li>Pilot design &amp; scale‑up (bench → pilot → demo; M&amp;E balance; PFD/P&amp;ID support)</li>
        <li>Process modeling &amp; simulation (LIX extractants, kinetics, speciation, RTD)</li>
        <li>Analytical methods &amp; SOPs (AAS/AES/ICP sample prep; QA/QC)</li>
        <li>Environmental &amp; circularity (effluent treatment, reagent recycling, LCA snapshots)</li>
      </ul>
    </section>
  )
}
