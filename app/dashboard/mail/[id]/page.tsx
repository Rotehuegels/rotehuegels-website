import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Reply, Forward, Trash2, FolderInput, Paperclip, Star } from 'lucide-react';
import { graphFetch } from '@/lib/microsoft';
import type { MsTokens } from '@/lib/microsoft';
import { redirect } from 'next/navigation';
import MailActions from './MailActions';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

interface GAddress { emailAddress: { name: string; address: string } }
interface GEmail {
  id: string;
  subject: string;
  from: GAddress;
  toRecipients: GAddress[];
  ccRecipients: GAddress[];
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  body: { contentType: string; content: string };
  importance: string;
  flag: { flagStatus: string };
}

async function getTokensFromCookies(): Promise<MsTokens | null> {
  const jar = await cookies();
  const raw = jar.get('ms_tokens')?.value;
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw)) as MsTokens; }
  catch { return null; }
}

export default async function MailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tokens = await getTokensFromCookies();
  if (!tokens) redirect('/dashboard/mail');

  let email: GEmail;
  try {
    const select = 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,isRead,hasAttachments,body,importance,flag';
    const { data } = await graphFetch(`me/messages/${id}?$select=${select}`, tokens);
    email = data as GEmail;

    // Mark as read
    if (!email.isRead) {
      await graphFetch(`me/messages/${id}`, tokens, {
        method: 'PATCH',
        json: { isRead: true },
      });
    }
  } catch (e) {
    console.error('Mail detail error:', e);
    redirect('/dashboard/mail');
  }

  const fromName = email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown';
  const fromAddr = email.from?.emailAddress?.address || '';
  const initial  = fromName.charAt(0).toUpperCase();
  const date     = new Date(email.receivedDateTime).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const toList = email.toRecipients?.map(r => r.emailAddress.name || r.emailAddress.address).join(', ') || '';
  const ccList = email.ccRecipients?.map(r => r.emailAddress.name || r.emailAddress.address).join(', ') || '';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/mail"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inbox
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/mail/compose?replyTo=${id}&to=${encodeURIComponent(fromAddr)}&subject=${encodeURIComponent('Re: ' + (email.subject || ''))}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <Reply className="h-3.5 w-3.5" /> Reply
          </Link>
          <Link
            href={`/dashboard/mail/compose?subject=${encodeURIComponent('Fwd: ' + (email.subject || ''))}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <Forward className="h-3.5 w-3.5" /> Forward
          </Link>
          <MailActions emailId={id} />
        </div>
      </div>

      <div className={`${glass} overflow-hidden`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/60 space-y-3">
          <div className="flex items-start gap-2">
            <h1 className="text-xl font-bold text-white flex-1">
              {email.subject || '(no subject)'}
            </h1>
            {email.importance === 'high' && (
              <Star className="h-5 w-5 text-amber-400 flex-shrink-0 mt-1" />
            )}
            {email.hasAttachments && (
              <Paperclip className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-1" />
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold bg-blue-500/20 text-blue-400">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-semibold text-white">{fromName}</p>
                <span className="text-xs text-zinc-500">&lt;{fromAddr}&gt;</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                To: {toList}
              </p>
              {ccList && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  CC: {ccList}
                </p>
              )}
              <p className="text-xs text-zinc-600 mt-1">{date}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {email.body.contentType === 'html' ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      font-size: 14px;
                      line-height: 1.6;
                      color: #d4d4d8;
                      background: transparent;
                      margin: 0;
                      padding: 0;
                    }
                    a { color: #60a5fa; }
                    img { max-width: 100%; height: auto; }
                    table { max-width: 100%; }
                    blockquote {
                      border-left: 3px solid #3f3f46;
                      margin-left: 0;
                      padding-left: 12px;
                      color: #71717a;
                    }
                  </style>
                </head>
                <body>${email.body.content}</body>
                </html>
              `}
              className="w-full min-h-[300px] border-0 bg-transparent"
              sandbox="allow-same-origin"
              title="Email content"
              onLoad={undefined}
            />
          ) : (
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">
              {email.body.content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
