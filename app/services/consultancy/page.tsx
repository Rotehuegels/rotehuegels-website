export const metadata = { title: 'Consultancy Services — Rotehuegels' }
export default function ConsultancyPage(){
  return (
    <section className="container mt-10">
      <h1>Consultancy</h1>
      <p className="mt-4 opacity-90">Commissioning, ramp‑up, troubleshooting, audits, training, and remote operations.</p>
      <ul className="list-disc pl-5 mt-4 space-y-2 opacity-90">
        <li>Plant commissioning &amp; ramp‑up (flotation, leach, SX‑EW)</li>
        <li>Troubleshooting (phase disengagement, crud, raffinate pH, tank hydraulics)</li>
        <li>Training &amp; SOPs (workforce upskilling, safety &amp; risk management)</li>
        <li>Audits (process health, reagent/energy efficiency, maintenance)</li>
        <li>Remote operations &amp; dashboards (KPIs, exception alerts)</li>
      </ul>
    </section>
  )
}
