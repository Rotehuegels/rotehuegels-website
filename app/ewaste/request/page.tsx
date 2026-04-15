import Link from 'next/link';
import { ArrowLeft, Recycle, Clock, Shield } from 'lucide-react';

export default function EWasteRequestPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Clock className="h-10 w-10 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Coming Soon</h1>
        <p className="text-sm text-zinc-400">
          E-waste collection service is not yet active. We are in the process of obtaining
          the necessary regulatory approvals:
        </p>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300 font-medium">Consent to Establish (CTE)</p>
              <p className="text-xs text-zinc-500">From Tamil Nadu Pollution Control Board</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300 font-medium">Consent to Operate (CTO)</p>
              <p className="text-xs text-zinc-500">From Tamil Nadu Pollution Control Board</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300 font-medium">E-Waste Authorization</p>
              <p className="text-xs text-zinc-500">Under E-Waste (Management) Rules, 2022</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-600">
          We cannot legally collect, store, or transport e-waste without these approvals.
          We are committed to full regulatory compliance.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link href="/ewaste/recycler-register"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
            <Recycle className="h-4 w-4 inline mr-2" />
            Register as Recycler (Open Now)
          </Link>
          <Link href="/ewaste" className="text-sm text-zinc-500 hover:text-zinc-300">
            <ArrowLeft className="h-3 w-3 inline mr-1" /> Back to E-Waste Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
