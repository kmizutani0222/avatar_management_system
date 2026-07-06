'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from '@ams/web-auth';
import { AdminConsole, OPERATOR_NAV } from '@ams/admin-ui';

function ConsoleLayoutInner({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <AdminConsole
      theme="operator"
      brandTitle="AMS Operator"
      brandSubtitle="外部連携ポータル"
      badgeLabel="Operator"
      navItems={OPERATOR_NAV}
      userName={profile?.companyName}
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
