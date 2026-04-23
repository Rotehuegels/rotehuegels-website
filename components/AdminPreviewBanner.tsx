import Link from 'next/link';
import { Eye, ArrowLeft } from 'lucide-react';

/**
 * Shown at the top of any gated surface (e.g. the client portal) when a
 * Rotehügels admin is browsing via the master-login bypass. Makes it
 * unmistakable that you are viewing the portal as an admin preview,
 * not as the actual client.
 */
export default function AdminPreviewBanner({
  email, customerName, backHref = '/d',
}: {
  email: string;
  customerName?: string | null;
  backHref?: string;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur">
      <div className="mx-auto max-w-[1800px] px-4 md:px-6 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-200 min-w-0">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold">Admin preview</span>
          <span className="text-amber-300/80 hidden sm:inline">· signed in as {email}</span>
          {customerName && (
            <span className="text-amber-300/80 truncate">· viewing <span className="font-semibold">{customerName}</span></span>
          )}
        </div>
        <Link href={backHref} className="inline-flex items-center gap-1 text-amber-200 hover:text-white no-underline shrink-0">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
