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
    // Array of attributes commonly injected by browser extensions that can cause hydration mismatches.
    const attrsToRemove = [
      'fdprocessedid',      // McAfee WebAdvisor, Feather DevTools
      'data-avast-orig-ctx',// Avast Online Security
      'data-avast-is-processed',
      'data-mcafeescript',    // Older McAfee
      'data-blocked',         // Generic privacy blockers
      // Add any other problematic attributes here
    ];

    const cleanDOM = () => {
      attrsToRemove.forEach(attr => {
        document.querySelectorAll(`[${attr}]`).forEach(el => {
          el.removeAttribute(attr);
        });
      });
    };

    // Run the cleanup script as soon as the client-side code executes.
    // This cleans the DOM before React's hydration process begins, preventing mismatches.
    cleanDOM();
    
  }, []);

  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
