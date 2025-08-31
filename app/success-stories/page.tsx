export const metadata = { title: 'Success Stories — Rotehuegels' }
export default function SuccessStories(){
  const cards = [
    { title:'Copper SX‑EW Optimization', outcome:'↑ current efficiency, ↓ crud, stable raffinate pH', detail:'Operational tuning and SOPs improved throughput and quality.'},
    { title:'Pilot Scale‑Up', outcome:'Bench → Pilot → Demo in 6 months', detail:'De-risked capex with staged validation and TEA updates.'},
    { title:'Battery Recycling Study', outcome:'Validated flowsheet with TEA', detail:'Black‑mass leach & recovery study with recyclability metrics.'},
  ]
  return (
    <section className="container mt-10">
      <h1>Success Stories</h1>
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {cards.map(c=>(
          <div key={c.title} className="card">
            <h3>{c.title}</h3>
            <p className="mt-2 opacity-90"><strong>Outcome:</strong> {c.outcome}</p>
            <p className="mt-2 opacity-80">{c.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
