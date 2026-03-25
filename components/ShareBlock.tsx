"use client";

import { useState } from "react";

export default function ShareBlock() {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? window.location.href
      : "https://www.rotehuegels.com/rotehuegels-story";

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-4 flex items-center gap-4 text-sm text-neutral-400">
      <span className="font-medium text-neutral-300">Share:</span>
      <button
        onClick={copyLink}
        className="hover:text-rose-400 transition-colors"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=The Rotehügels Story`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-rose-400 transition-colors"
      >
        Twitter
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=The Rotehügels Story`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-rose-400 transition-colors"
      >
        LinkedIn
      </a>
    </div>
  );
}