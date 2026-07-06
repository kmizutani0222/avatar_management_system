'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { groupNavBySection, type NavItem } from './nav-config';

export interface AdminConsoleProps {
  theme: 'admin' | 'operator' | 'user';
  brandTitle: string;
  brandSubtitle?: string;
  badgeLabel?: string;
  navItems: NavItem[];
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  children: ReactNode;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminConsole({
  theme,
  brandTitle,
  brandSubtitle,
  badgeLabel,
  navItems,
  userName,
  userEmail,
  onLogout,
  children,
}: AdminConsoleProps) {
  const pathname = usePathname();
  const sections = groupNavBySection(navItems);
  const activeItem = navItems.find((item) => isActive(pathname, item.href));

  return (
    <div className="ams-console" data-theme={theme}>
      <aside className="ams-sidebar">
        <div className="ams-sidebar-brand">
          <div className="ams-sidebar-brand-title">{brandTitle}</div>
          {brandSubtitle && <div className="ams-sidebar-brand-sub">{brandSubtitle}</div>}
          {badgeLabel && <span className="ams-sidebar-badge">{badgeLabel}</span>}
        </div>

        <nav className="ams-sidebar-nav" aria-label="Main navigation">
          {Array.from(sections.entries()).map(([section, items]) => (
            <div key={section} className="ams-nav-section">
              <div className="ams-nav-section-label">{section}</div>
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ams-nav-link${isActive(pathname, item.href) ? ' active' : ''}`}
                >
                  {item.icon && <span className="ams-nav-icon" aria-hidden>{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="ams-sidebar-footer">
          {(userName || userEmail) && (
            <div className="ams-sidebar-user">
              {userName && <div className="ams-sidebar-user-name">{userName}</div>}
              {userEmail && <div className="ams-sidebar-user-email">{userEmail}</div>}
            </div>
          )}
          {onLogout && (
            <button type="button" className="btn-secondary btn-sm" style={{ width: '100%' }} onClick={onLogout}>
              ログアウト
            </button>
          )}
        </div>
      </aside>

      <div className="ams-main">
        <header className="ams-topbar">
          <span className="ams-topbar-title">{activeItem?.label ?? brandTitle}</span>
        </header>
        <div className="ams-content">{children}</div>
      </div>
    </div>
  );
}
