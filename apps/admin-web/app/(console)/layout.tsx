'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AdminConsole, buildAdminNav } from '@ams/admin-ui';

function ConsoleLayoutInner({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const navItems = useMemo(
    () => buildAdminNav(profile?.adminLevel === 'super'),
    [profile?.adminLevel],
  );

  return (
    <AdminConsole
      theme="admin"
      brandTitle="AMS Admin"
      brandSubtitle="Avatar Management System"
      badgeLabel="Admin"
      navItems={navItems}
      userName={profile?.displayName}
      userEmail={profile?.email}
      onLogout={() => {
        logout();
        router.push('/login');
      }}
    >
      {children}
    </AdminConsole>
  );
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ConsoleLayoutInner>{children}</ConsoleLayoutInner>
    </RequireAuth>
  );
}
