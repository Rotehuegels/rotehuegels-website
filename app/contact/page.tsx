// app/contact/page.tsx
export const metadata = { title: 'Contact Us — Rotehuegels' }

export default function ContactPage(){
  return (
    <section className="container mt-10">
      <h1>Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-6 mt-6">

        {/* India HQ */}
        <div className="card">
          <h3>Registered Office (India HQ)</h3>
          <p className="mt-2 opacity-90">
            No. 1/584, 7th Street, Jothi Nagar, Padianallur,<br/>
            Near Gangaiamman Kovil, Redhills, Chennai – 600052<br/>
            Tamil Nadu, India
          </p>
          <p className="mt-3">📧 <a href="mailto:info@rotehuegels.com">info@rotehuegels.com</a></p>
          <p>📧 <a href="mailto:sales@rotehuegels.com">sales@rotehuegels.com</a> (RFPs / Proposals)</p>
          <p>📱 <a href="tel:+919004491275">+91 90044 91275</a></p>
          <p>🌐 <a href="https://www.rotehuegels.com">www.rotehuegels.com</a></p>
        </div>

        {/* International Rep */}
        <div className="card">
          <h3>International Sales & Marketing</h3>
          <p className="mt-2 opacity-90">
            <strong>Ms. Vaishnavi Elumalai</strong><br/>
            Sales & Marketing (Technical)<br/>
            Americas, Europe & Africa
          </p>
          <p className="mt-3">📧 <a href="mailto:vaishnavi@rotehuegels.com">vaishnavi@rotehuegels.com</a></p>
          <p>📱 <a href="tel:+18477787595">+1 847 778 7595</a></p>
          <p>🔗 <a href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/" target="_blank" rel="noopener noreferrer">LinkedIn — Vaishnavi Elumalai</a></p>
        </div>
      </div>

      {/* Territory Allocation Section */}
      <div className="card mt-10">
        <h3>Territory Allocation</h3>
        <ul className="mt-3 space-y-2 text-sm opacity-90">
          <li>
            • <strong>Ms. Vaishnavi Elumalai</strong> (Independent Contractor – Sales & Marketing, Technical): 
            <em> Americas (USA, Canada, South America), Europe, and Africa</em>
          </li>
          <li>
            • <strong>Mr. Sivakumar Shanmugam</strong> (Director & CEO, Rotehügels): 
            <em> Asia-Pacific, Middle East, India, and Oceania</em>
          </li>
        </ul>
      </div>

      {/* General CTA */}
      <div className="card mt-10 text-center">
        <h3>Get in Touch</h3>
        <p className="opacity-90 mt-2">Prefer email? Choose the right address:</p>
        <p className="mt-3">
          General Enquiries: <a className="text-rose-400 hover:underline" href="mailto:info@rotehuegels.com">info@rotehuegels.com</a><br/>
          RFPs / Scope Notes: <a className="text-rose-400 hover:underline" href="mailto:sales@rotehuegels.com">sales@rotehuegels.com</a>
        </p>
      </div>
    </section>
  )
}