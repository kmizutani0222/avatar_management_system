'use client';

import type { ReactNode } from 'react';

export interface PreviewFrameProps {
  className?: string;
  showControlsHint?: boolean;
  children: ReactNode;
}

export function PreviewFrame({
  className,
  showControlsHint = true,
  children,
}: PreviewFrameProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        background: '#0a0f1a',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {children}
      {showControlsHint && (
        <p
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '0.75rem',
            left: '50%',
            transform: 'translateX(-50%)',
            margin: 0,
            padding: '0.375rem 0.875rem',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(71, 85, 105, 0.45)',
            color: '#94a3b8',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          ドラッグ: 回転 · Shift+ドラッグ: 移動 · スクロール: 拡大
        </p>
      )}
    </div>
  );
}
