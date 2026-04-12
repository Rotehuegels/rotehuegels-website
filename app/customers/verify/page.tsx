'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    fetch(`/api/customer-registrations/verify?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success || d.message?.includes('already verified')) {
          setStatus('success');
          setMessage(d.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(d.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      });
  }, [token]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Image src="/logo.png" alt="Rotehügels" width={150} height={42} className="mx-auto mb-6" priority />

        {status === 'loading' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-rose-400 mx-auto" />
            <p className="text-sm text-zinc-400">Verifying your email…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-900/20 p-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Email Verified!</h1>
            <p className="text-sm text-zinc-400">{message}</p>
            <p className="text-sm text-zinc-400">
              Our team will review your KYC details and you'll receive your Customer ID once approved.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-800/60 bg-red-900/20 p-8 space-y-4">
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Verification Failed</h1>
            <p className="text-sm text-zinc-400">{message}</p>
          </div>
        )}

        <Link href="/" className="inline-block mt-6 text-sm text-zinc-400 hover:text-white transition-colors">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
