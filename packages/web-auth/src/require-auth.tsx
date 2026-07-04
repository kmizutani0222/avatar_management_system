'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace('/login');
    }
  }, [isLoading, profile, router]);

  if (isLoading) {
    return <p className="loading-text">読み込み中...</p>;
  }

  if (!profile) return null;

  return <>{children}</>;
}
