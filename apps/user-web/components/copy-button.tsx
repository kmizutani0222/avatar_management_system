'use client';

import { useState } from 'react';

export function CopyButton({ value, label = 'コピー' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button type="button" className="btn-secondary btn-sm" onClick={handleCopy}>
      {copied ? 'コピー済' : label}
    </button>
  );
}
