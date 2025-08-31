import Hero from '@/components/Hero'
import Link from 'next/link'

export default function HomePage(){
  return (
    <>
      <Hero />
      <section className="container mt-12 grid md:grid-cols-3 gap-6">
        {[
          {title:'Research', desc:'Hydrometallurgy R&D, pilot design, process modeling, analytical SOPs.', href:'/services/research'},
          {title:'Business', desc:'TEA, market analysis, procurement, investor collateral, policy watch.', href:'/services/business'},
          {title:'Consultancy', desc:'Commissioning, ramp-up, troubleshooting, audits, remote ops & KPIs.', href:'/services/consultancy'},
        ].map(card=>(
          <div key={card.title} className="card">
            <h3>{card.title}</h3>
            <p className="opacity-90 mt-2">{card.desc}</p>
            <Link href={card.href} className="btn-primary inline-block mt-4 no-underline">Explore</Link>
          </div>
        ))}
      </section>
      <section className="container mt-12">
        <div className="card">
          <h3>Current Updates</h3>
          <p className="opacity-80">Live market & news relevant to metals and industry.</p>
          <Link href="/current-updates" className="btn-ghost mt-3 inline-block no-underline">Open Updates</Link>
        </div>
      </section>
    </>
  )
}
