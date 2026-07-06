import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AMS User',
  description: 'Avatar Management System - User Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" data-theme="user">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
