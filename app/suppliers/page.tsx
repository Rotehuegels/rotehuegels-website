'use client';
import { useState } from 'react'

export const metadata = { title: 'Suppliers — Rotehuegels' }

export default function SuppliersPage(){
  const [submitted, setSubmitted] = useState(false)
  return (
    <section className="container mt-10">
      <h1>Suppliers</h1>
      <p className="mt-3 opacity-90">Partner with us for equipment, reagents, lab & metrology, logistics, and services.</p>
      <div className="card mt-6">
        <h3>Supplier Onboarding Form</h3>
        {!submitted ? (
          <form className="mt-4 grid md:grid-cols-2 gap-4" onSubmit={(e)=>{e.preventDefault(); setSubmitted(true)}}>
            <input className="card" placeholder="Company Name" required />
            <input className="card" placeholder="Contact Person" required />
            <input className="card" placeholder="Email" type="email" required />
            <input className="card" placeholder="Phone" required />
            <input className="card md:col-span-2" placeholder="Website (optional)" />
            <textarea className="card md:col-span-2" placeholder="Product categories / brief" rows={4}/>
            <button className="btn-primary md:col-span-2" type="submit">Submit</button>
            <p className="opacity-70 md:col-span-2 text-sm">Note: This demo form stores data in memory only. Connect to Formspree, Airtable, or a Next.js server action for production.</p>
          </form>
        ):<p className="mt-3">Thanks! We&apos;ll review and reach out if there&apos;s a fit.</p>}
      </div>
    </section>
  )
}
