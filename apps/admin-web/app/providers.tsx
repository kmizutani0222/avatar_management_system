'use client';

import { AuthProvider } from '@ams/web-auth';
import { getApiUrl } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider apiUrl={getApiUrl()} role="admin">
      {children}
    </AuthProvider>
  );
}
