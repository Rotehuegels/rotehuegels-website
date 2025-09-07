// app/suppliers/page.tsx
"use client";

import React, { useState } from "react";

type FormState = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  product_categories: string;
  certifications: string;
  notes: string;
};

export default function SuppliersPage() {
  const [form, setForm] = useState<FormState>({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    country: "",
    website: "",
    product_categories: "",
    certifications: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const onChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    // Simple client-side validation
    const missing: string[] = [];
    if (!form.company_name.trim()) missing.push("Company Name");
    if (!form.contact_person.trim()) missing.push("Contact Person");
    if (!form.email.trim()) missing.push("Email");
    if (!form.product_categories.trim()) missing.push("Product Categories");
    if (missing.length) {
      setErrMsg(`Please fill: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // send both for compatibility with server normalization
          product_service: form.product_categories,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to submit. Try again.");
      }

      setOkMsg("Thank you! Your details were submitted successfully.");
      // reset the form
      setForm({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        country: "",
        website: "",
        product_categories: "",
        certifications: "",
        notes: "",
      });
    } catch (err: any) {
      setErrMsg(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex justify-center px-4 my-12">
      <div className="w-full max-w-2xl bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2 text-white">
          Supplier Registration
        </h1>
        <p className="text-zinc-400 mb-6 text-sm">
          Share your details to collaborate with Rotehügel Research Business
          Consultancy Private Limited.
        </p>

        {okMsg && (
          <div className="mb-6 rounded-lg border border-emerald-700 bg-emerald-900/40 text-emerald-200 px-4 py-3">
            {okMsg}
          </div>
        )}
        {errMsg && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/40 text-red-200 px-4 py-3">
            {errMsg}
          </div>
        )}

        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              value={form.company_name}
              onChange={onChange("company_name")}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              value={form.contact_person}
              onChange={onChange("contact_person")}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Email *</label>
              <input
                type="email"
                required
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                value={form.email}
                onChange={onChange("email")}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Phone</label>
              <input
                type="text"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                value={form.phone}
                onChange={onChange("phone")}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Country</label>
              <input
                type="text"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                value={form.country}
                onChange={onChange("country")}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Website</label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                value={form.website}
                onChange={onChange("website")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Product Categories *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., SX/EW equipment; Reagents"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              value={form.product_categories}
              onChange={onChange("product_categories")}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Certifications
            </label>
            <input
              type="text"
              placeholder="ISO 9001, ISO 14001"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              value={form.certifications}
              onChange={onChange("certifications")}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              value={form.notes}
              onChange={onChange("notes")}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}