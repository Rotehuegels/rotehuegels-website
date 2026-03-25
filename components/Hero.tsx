import Link from 'next/link';

export default function Hero(){
  return (
    <section className="container mt-10 md:mt-16">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1>Where Research Meets Business Excellence</h1>
          <p className="mt-4 text-lg opacity-90">
            At <strong>Rotehuegel Research Business Consultancy Private Limited</strong>, we integrate scientific innovation with strategic business advisory to deliver sustainable, measurable, and globally relevant solutions.
          </p>
          <p className="mt-2 opacity-80">
            From metallurgy and critical minerals to circular economy and business strategy, we help organizations navigate complexity and achieve long‑term success.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/services" className="btn-primary no-underline">Explore Our Services</Link>
            <Link href="/contact" className="btn-ghost no-underline">Contact Us</Link>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2">Quick Facts</h3>
          <ul className="list-disc pl-5 space-y-1 opacity-90">
            <li>Headquartered in Chennai, India</li>
            <li>Expertise: extractive metallurgy, critical minerals, circular economy</li>
            <li>Engagements: R&amp;D, techno‑economic, commissioning, optimization</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
