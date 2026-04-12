'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Building2, Loader2 } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

const BUSINESS_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'public_ltd', label: 'Public Limited' },
  { value: 'trust', label: 'Trust / Society' },
  { value: 'govt', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const COUNTRIES = [
  'India', 'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Cambodia', 'Cameroon', 'Canada',
  'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Democratic Republic of Congo', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Estonia', 'Ethiopia', 'Finland', 'France', 'Gabon', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Guatemala', 'Guinea', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Mali', 'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Mongolia', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

const INDUSTRIES = [
  'Metals & Mining', 'Electrochemical Processing', 'Water Treatment',
  'Manufacturing', 'Construction', 'Energy & Power', 'Chemicals',
  'Automobile', 'Defence', 'Pharmaceuticals', 'Food & Beverage',
  'Battery Recycling', 'Waste Management', 'Research & Education', 'Other',
];

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5';

export default function CustomerRegisterPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setError] = useState('');
  const [regNo, setRegNo] = useState('');
  const [terms, setTerms] = useState(false);
  const [country, setCountry] = useState('India');
  const isIndia = country === 'India';

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      company_name: fd.get('company_name'),
      contact_person: fd.get('contact_person'),
      email: fd.get('email'),
      phone: fd.get('phone') || undefined,
      website: fd.get('website') || undefined,
      country,
      gstin: isIndia ? (fd.get('gstin') || undefined) : undefined,
      pan: isIndia ? (fd.get('pan') || undefined) : undefined,
      tax_id: !isIndia ? (fd.get('tax_id') || undefined) : undefined,
      business_type: fd.get('business_type') || undefined,
      industry: fd.get('industry') || undefined,
      billing_address: {
        line1: fd.get('addr_line1'),
        line2: fd.get('addr_line2') || '',
        city: fd.get('addr_city'),
        state: fd.get('addr_state'),
        pincode: fd.get('addr_pincode') || '',
        country,
      },
      terms_accepted: terms,
      source: 'website',
    };

    try {
      const res = await fetch('/api/customer-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === 'string' ? data.error : Object.values(data.error).flat().join(', ');
        setError(msg);
        setStatus('error');
        return;
      }
      setRegNo(data.reg_no);
      setStatus('success');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto mb-6" priority />
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/20 p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Registration Submitted!</h1>
            <p className="text-sm text-zinc-400">
              Your reference number is <strong className="text-emerald-400">{regNo}</strong>
            </p>
            <p className="text-sm text-zinc-400">
              We've sent a verification email to your registered email address. Please click the link to verify your email and complete the KYC process.
            </p>
            <p className="text-xs text-zinc-500 mt-4">The verification link expires in 24 hours.</p>
          </div>
          <Link href="/" className="inline-block mt-6 text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto" priority /></Link>
          <h1 className="mt-4 text-xl font-bold text-white flex items-center justify-center gap-2">
            <Building2 className="h-5 w-5 text-rose-400" /> Customer Registration
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Register your company to start working with Rotehügels</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 sm:p-8">

          {/* Company Info */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Company Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Company Name *</label>
                <input name="company_name" required placeholder="e.g., ABC Industries Pvt Ltd" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact Person *</label>
                <input name="contact_person" required placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email Address *</label>
                <input name="email" type="email" required placeholder="company@example.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input name="phone" type="tel" placeholder="+91-XXXXX XXXXX" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input name="website" placeholder="www.example.com" className={inputCls} />
              </div>
            </div>
          </div>

          {/* KYC Details */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">KYC Details</h2>
            <p className="text-xs text-zinc-500 mb-4">
              {isIndia ? 'At least GSTIN or PAN is required' : 'Tax ID (VAT/EIN/TIN) is required for international customers'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Country *</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className={inputCls}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {isIndia ? (
                <>
                  <div>
                    <label className={labelCls}>GSTIN</label>
                    <input name="gstin" placeholder="e.g., 33AABCU9603R1ZM" maxLength={15} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>PAN</label>
                    <input name="pan" placeholder="e.g., AABCU9603R" maxLength={10} className={inputCls} />
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelCls}>Tax ID (VAT / EIN / TIN) *</label>
                  <input name="tax_id" placeholder="Your tax identification number" className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Business Type</label>
                <select name="business_type" className={inputCls}>
                  <option value="">Select…</option>
                  {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Industry</label>
                <select name="industry" className={inputCls}>
                  <option value="">Select…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4">Billing Address *</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Address Line 1 *</label>
                <input name="addr_line1" required placeholder="Street, building, area" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Address Line 2</label>
                <input name="addr_line2" placeholder="Landmark, locality" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>City *</label>
                <input name="addr_city" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State / Region *</label>
                {isIndia ? (
                  <select name="addr_state" required className={inputCls}>
                    <option value="">Select…</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input name="addr_state" required placeholder="State / Province / Region" className={inputCls} />
                )}
              </div>
              <div>
                <label className={labelCls}>{isIndia ? 'Pincode *' : 'Postal / ZIP Code'}</label>
                <input name="addr_pincode" required={isIndia} maxLength={10} placeholder={isIndia ? '600001' : 'Postal code'} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={terms}
              onChange={e => setTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-rose-500 focus:ring-rose-500"
            />
            <label className="text-xs text-zinc-400 leading-relaxed">
              I confirm that the information provided is accurate and I agree to Rotehügels' terms of service and privacy policy.
              I consent to KYC verification of the details submitted.
            </label>
          </div>

          {/* Error */}
          {status === 'error' && errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading' || !terms}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
          >
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            {status === 'loading' ? 'Submitting…' : 'Register & Verify Email'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Already a customer? <Link href="/login" className="text-rose-400 hover:text-rose-300">Sign in to the portal</Link>
        </p>
      </div>
    </main>
  );
}
