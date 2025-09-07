// app/suppliers/page.tsx
"use client";

import React, { useState } from "react";

export default function SuppliersPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || "Failed to submit");
      }

      setStatus({ ok: true, msg: "Thank you! Your supplier profile has been submitted." });
      form.reset();
    } catch (err: any) {
      setStatus({ ok: false, msg: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500";
  const label = "text-sm text-zinc-300";

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-bold">Supplier Registration</h1>
        <p className="text-zinc-300 max-w-3xl">
          Share your company details to be considered for partnerships in equipment, reagents,
          lab & metrology, logistics, and services.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        {/* Company */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Company Name *</label>
            <input name="company_name" required className={input} placeholder="Your Company Pvt Ltd" />
          </div>
          <div>
            <label className={label}>Website</label>
            <input name="website" className={input} placeholder="https://example.com" />
          </div>
        </div>

        {/* Contact */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={label}>Contact Person *</label>
            <input name="contact_name" required className={input} placeholder="Full Name" />
          </div>
          <div>
            <label className={label}>Email *</label>
            <input type="email" name="email" required className={input} placeholder="name@company.com" />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input name="phone" className={input} placeholder="+91 98765 43210" />
          </div>
        </div>

        {/* Business */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Country</label>
            <input name="country" className={input} placeholder="India" />
          </div>
          <div>
            <label className={label}>Certifications (ISO, etc.)</label>
            <input name="certifications" className={input} placeholder="ISO 9001, ISO 14001" />
          </div>
        </div>

        <div>
          <label className={label}>Products / Services *</label>
          <textarea
            name="product_service"
            required
            rows={4}
            className={input}
            placeholder="e.g., SX/EW equipment, reagents, lab services..."
          />
        </div>

        <div>
          <label className={label}>Notes</label>
          <textarea
            name="notes"
            rows={4}
            className={input}
            placeholder="Experience highlights, client references, sustainability initiatives..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary no-underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit Supplier Profile"}
          </button>

          {status && (
            <span className={status.ok ? "text-green-400 text-sm" : "text-rose-400 text-sm"}>
              {status.msg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
