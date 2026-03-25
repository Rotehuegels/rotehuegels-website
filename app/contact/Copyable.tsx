// app/contact/Copyable.tsx
"use client";

import { useState } from "react";

export function Copyable({
  label,
  value,
  href,
  ariaLabel,
}: {
  label: string; // emoji or icon
  value: string; // display text
  href?: string; // tel: or mailto:
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s+/g, " "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  const line = <span className="underline-offset-4 hover:underline">{value}</span>;

  return (
    <p className="flex items-center gap-2">
      <span aria-hidden="true">{label}</span>
      {href ? (
        <a
          href={href}
          aria-label={ariaLabel || value}
          className="focus:outline-none focus:ring-2 focus:ring-rose-400 rounded"
        >
          {line}
        </a>
      ) : (
        line
      )}
      <button
        type="button"
        onClick={onCopy}
        className="ml-2 rounded px-2 py-0.5 text-xs text-white/80 bg-white/10 hover:bg-white/15 transition"
        aria-label={`Copy ${value}`}
        title="Copy"
      >
        Copy
      </button>
      <span
        role="status"
        aria-live="polite"
        className={`ml-2 text-xs ${copied ? "opacity-100" : "opacity-0"} transition`}
      >
        Copied!
      </span>
    </p>
  );
}