
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// This metadata is now static since we are in a client component at the root.
// For dynamic metadata, it should be handled in child server components.
export const metadata: Metadata = {
  title: 'Epiplagrafeiou.gr AI eShop',
  description: 'Your one-stop shop for office furniture, powered by AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // This script runs on the client to clean up attributes injected by browser extensions
    // that can cause React hydration errors.
    if (typeof window !== 'undefined') {
      document.querySelectorAll('[fdprocessedid]').forEach((el) => {
        el.removeAttribute('fdprocessedid');
      });
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
