export const metadata = { title: 'Contact Us — Rotehuegels' }

export default function ContactPage(){
  return (
    <section className="container mt-10">
      <h1>Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h3>Registered Office</h3>
          <p className="mt-2 opacity-90">
            No. 1/584, 7th Street, Jothi Nagar, Padianallur,<br/>
            Near Gangaiamman Kovil, Redhills, Chennai – 600052<br/>
            Tamil Nadu, India
          </p>
          <p className="mt-3">📧 <a href="mailto:sivakumar@rotehuegels.com">sivakumar@rotehuegels.com</a></p>
          <p>📱 +91‑90044‑91275</p>
          <p>🌐 <a href="https://www.rotehuegels.com">www.rotehuegels.com</a></p>
        </div>
        <div className="card">
          <h3>Get in Touch</h3>
          <p className="opacity-90">Prefer email? Click the button below to draft an email.</p>
          <a className="btn-primary inline-block mt-3 no-underline" href="mailto:sivakumar@rotehuegels.com?subject=Enquiry%20from%20Website">Email Us</a>
          <p className="opacity-70 text-sm mt-4">For a full form with backend handling, connect Formspree or a Next.js server action.</p>
        </div>
      </div>
    </section>
  )
}
