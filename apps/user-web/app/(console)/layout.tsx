'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AdminConsole, USER_NAV } from '@ams/admin-ui';

function ConsoleLayoutInner({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <AdminConsole
      theme="user"
      brandTitle="マイアバター"
      brandSubtitle="Avatar Management System"
      navItems={USER_NAV}
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
