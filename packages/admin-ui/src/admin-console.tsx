'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { groupNavBySection, type NavItem } from './nav-config';

export interface AdminConsoleProps {
  theme: 'admin' | 'operator' | 'user';
  brandTitle: string;
  brandSubtitle?: string;
  badgeLabel?: string;
  navItems: NavItem[];
  accountHref?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  children: ReactNode;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAccountActive(pathname: string, accountHref: string): boolean {
  return pathname === accountHref || pathname.startsWith(`${accountHref}/`);
}

export function AdminConsole({
  theme,
  brandTitle,
  brandSubtitle,
  badgeLabel,
  navItems,
  accountHref = '/account',
  userName,
  userEmail,
  onLogout,
  children,
}: AdminConsoleProps) {
  const pathname = usePathname();
  const sections = groupNavBySection(navItems);
  const activeItem = navItems.find((item) => isActive(pathname, item.href));
  const accountActive = isAccountActive(pathname, accountHref);
  const topbarTitle = accountActive ? 'アカウント' : (activeItem?.label ?? brandTitle);

  const [menuOpen, setMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

        <div className="ams-sidebar-footer" ref={footerRef}>
          <button
            type="button"
            className={`ams-sidebar-account-menu${menuOpen || accountActive ? ' active' : ''}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="ams-sidebar-account-icon" aria-hidden>
              👤
            </span>
            <span className="ams-sidebar-account-body">
              <span className="ams-sidebar-account-title">アカウント</span>
              {userName && <span className="ams-sidebar-user-name">{userName}</span>}
              {userEmail && <span className="ams-sidebar-user-email">{userEmail}</span>}
            </span>
            <span className="ams-sidebar-account-chevron" aria-hidden>
              {menuOpen ? '▴' : '▾'}
            </span>
          </button>

          {menuOpen && (
            <div className="ams-sidebar-account-popup" role="menu">
              <Link
                href={accountHref}
                className="ams-sidebar-account-popup-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                アカウント
              </Link>
              {onLogout && (
                <button
                  type="button"
                  className="ams-sidebar-account-popup-item ams-sidebar-account-popup-logout"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  ログアウト
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <div className="ams-main">
        <header className="ams-topbar">
          <span className="ams-topbar-title">{topbarTitle}</span>
        </header>
        <div className="ams-content">{children}</div>
      </div>
    </div>
  );
}
