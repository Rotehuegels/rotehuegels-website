import { cookies } from 'next/headers';
import Link from 'next/link';
import { Mail, Inbox, Send, Trash2, FileText, Star, AlertCircle, Paperclip, Search, Plus, RefreshCw } from 'lucide-react';
import { graphFetch } from '@/lib/microsoft';
import type { MsTokens } from '@/lib/microsoft';
import MailListClient from './MailListClient';

const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm';

interface GFolder {
  id: string;
  displayName: string;
  unreadItemCount: number;
  totalItemCount: number;
}

interface GAddress { emailAddress: { name: string; address: string } }
interface GMessage {
  id: string;
  subject: string;
  from: GAddress;
  toRecipients: GAddress[];
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  bodyPreview: string;
  importance: string;
}

const FOLDER_ICONS: Record<string, React.ElementType> = {
  Inbox: Inbox,
  'Sent Items': Send,
  Drafts: FileText,
  'Deleted Items': Trash2,
  'Junk Email': AlertCircle,
};

async function getTokensFromCookies(): Promise<MsTokens | null> {
  const jar = await cookies();
  const raw = jar.get('ms_tokens')?.value;
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw)) as MsTokens; }
  catch { return null; }
}

export default async function MailPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; page?: string; search?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const tokens = await getTokensFromCookies();

  if (!tokens || sp.error) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Mail</h1>
        {sp.error && (
          <div className={`${glass} p-4 border-red-500/30`}>
            <p className="text-sm text-red-400">Authentication error: {sp.error}</p>
          </div>
        )}
        <div className={`${glass} p-12 text-center`}>
          <Mail className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Connect Microsoft 365</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Link your Microsoft 365 account to access your emails from the dashboard.
          </p>
          <a
            href="/api/auth/microsoft/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Connect Microsoft 365
          </a>
        </div>
      </div>
    );
  }

  const activeFolder = sp.folder || 'inbox';
  const page = parseInt(sp.page || '0', 10);
  const search = sp.search || '';

  // Fetch folders + messages in parallel
  let folders: GFolder[] = [];
  let messages: GMessage[] = [];
  let totalCount = 0;
  let fetchError = false;

  try {
    const [foldersRes, messagesRes] = await Promise.all([
      graphFetch('me/mailFolders?$top=50', tokens),
      graphFetch(
        `me/mailFolders/${activeFolder}/messages?$top=25&$skip=${page * 25}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,receivedDateTime,isRead,hasAttachments,bodyPreview,importance${search ? `&$search="${encodeURIComponent(search)}"` : ''}&$count=true`,
        tokens,
        { headers: { ConsistencyLevel: 'eventual' } },
      ),
    ]);

    const fData = foldersRes.data as { value: GFolder[] };
    folders = fData.value;

    const mData = messagesRes.data as { value: GMessage[]; '@odata.count'?: number };
    messages = mData.value;
    totalCount = mData['@odata.count'] ?? mData.value.length;
  } catch (e) {
    console.error('Mail fetch error:', e);
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Mail</h1>
        <div className={`${glass} p-12 text-center`}>
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Failed to connect to Microsoft 365. Your session may have expired.
          </p>
          <a
            href="/api/auth/microsoft/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reconnect
          </a>
        </div>
      </div>
    );
  }

  const totalUnread = folders.reduce((s, f) => s + f.unreadItemCount, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mail</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
          </p>
        </div>
        <Link
          href="/dashboard/mail/compose"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Compose
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Folder sidebar */}
        <div className={`${glass} p-3 space-y-0.5`}>
          {folders.map(f => {
            const Icon = FOLDER_ICONS[f.displayName] ?? FileText;
            const isActive = f.displayName.toLowerCase().replace(/\s+/g, '') === activeFolder
              || f.id === activeFolder;
            const folderId = f.displayName.toLowerCase() === 'inbox' ? 'inbox' : f.id;
            return (
              <Link
                key={f.id}
                href={`/dashboard/mail?folder=${folderId}`}
                className={[
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
                ].join(' ')}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  {f.displayName}
                </span>
                {f.unreadItemCount > 0 && (
                  <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md">
                    {f.unreadItemCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Message list */}
        <div className={glass}>
          {/* Search bar */}
          <MailListClient
            activeFolder={activeFolder}
            search={search}
          />

          {messages.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {search ? 'No messages match your search.' : 'No messages in this folder.'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-800/60">
                {messages.map(m => {
                  const fromName = m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Unknown';
                  const fromAddr = m.from?.emailAddress?.address || '';
                  const initial  = fromName.charAt(0).toUpperCase();
                  const date     = new Date(m.receivedDateTime).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  });

                  return (
                    <Link
                      key={m.id}
                      href={`/dashboard/mail/${m.id}`}
                      className={[
                        'flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors',
                        !m.isRead ? 'bg-zinc-800/10' : '',
                      ].join(' ')}
                    >
                      {/* Avatar */}
                      <div className={[
                        'flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold',
                        !m.isRead
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-800 text-zinc-500',
                      ].join(' ')}>
                        {initial}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${!m.isRead ? 'font-semibold text-white' : 'text-zinc-300'}`}>
                            {fromName}
                          </p>
                          <span className="text-[11px] text-zinc-500 whitespace-nowrap flex-shrink-0">
                            {date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${!m.isRead ? 'font-medium text-zinc-200' : 'text-zinc-400'}`}>
                            {m.subject || '(no subject)'}
                          </p>
                          {m.importance === 'high' && (
                            <Star className="h-3 w-3 text-amber-400 flex-shrink-0" />
                          )}
                          {m.hasAttachments && (
                            <Paperclip className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 truncate mt-0.5">
                          {m.bodyPreview}
                        </p>
                      </div>

                      {!m.isRead && (
                        <div className="flex-shrink-0 mt-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-500">
                  Showing {page * 25 + 1}-{Math.min((page + 1) * 25, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  {page > 0 && (
                    <Link
                      href={`/dashboard/mail?folder=${activeFolder}&page=${page - 1}${search ? `&search=${search}` : ''}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {(page + 1) * 25 < totalCount && (
                    <Link
                      href={`/dashboard/mail?folder=${activeFolder}&page=${page + 1}${search ? `&search=${search}` : ''}`}
                      className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
