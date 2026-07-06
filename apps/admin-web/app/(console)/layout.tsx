'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AdminConsole, ADMIN_NAV } from '@ams/admin-ui';

function ConsoleLayoutInner({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <AdminConsole
      theme="admin"
      brandTitle="AMS Admin"
      brandSubtitle="Avatar Management System"
      badgeLabel="Admin"
      navItems={ADMIN_NAV}
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
