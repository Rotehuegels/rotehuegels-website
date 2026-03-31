'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { parseSBI, type ParsedStatement } from '@/lib/parseSBI';

interface Props {
  onSuccess: () => void;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function BankUploader({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed]   = useState<ParsedStatement | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsed(null);
    setParseErr(null);
    setImportMsg(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const result = parseSBI(text);
        if (result.transactions.length === 0) {
          setParseErr('No transactions found in this file.');
        } else {
          setParsed(result);
        }
      } catch (err) {
        setParseErr(err instanceof Error ? err.message : 'Failed to parse CSV.');
      }
    };
    reader.onerror = () => setParseErr('Could not read the file.');
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch('/api/accounts/bank-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_no:     parsed.account_no,
          statement_from: parsed.period_from,
          statement_to:   parsed.period_to,
          transactions:   parsed.transactions,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Import failed.');
      setImportMsg(`${json.inserted} transaction${json.inserted === 1 ? '' : 's'} imported.`);
      setParsed(null);
      if (inputRef.current) inputRef.current.value = '';
      onSuccess();
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700/60 hover:text-white transition-colors">
          <Upload className="h-4 w-4 text-amber-400" />
          Choose SBI CSV
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="sr-only"
          onChange={handleFile}
        />
      </label>

      {parseErr && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          {parseErr}
        </p>
      )}

      {parsed && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-300">
            Found{' '}
            <span className="font-semibold text-white">{parsed.transactions.length}</span>{' '}
            transaction{parsed.transactions.length === 1 ? '' : 's'}
            {parsed.period_from && parsed.period_to && (
              <> ({isoToDisplay(parsed.period_from)} – {isoToDisplay(parsed.period_to)})</>
            )}
          </p>
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
            ) : (
              'Import'
            )}
          </button>
        </div>
      )}

      {importMsg && (
        <p className={`text-sm rounded-lg px-3 py-2 border ${
          importMsg.includes('imported')
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        }`}>
          {importMsg}
        </p>
      )}
    </div>
  );
}
