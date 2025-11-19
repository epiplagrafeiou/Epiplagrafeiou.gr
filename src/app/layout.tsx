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
      'fdprocessedid',
      'data-avast-orig-ctx',
      'data-avast-is-processed',
      'data-mcafeescript',
      'data-blocked',
    ];

    const cleanNode = (node: Node) => {
      if (node.nodeType === 1 && (node as Element).hasAttributes()) { // It's an element node
        const el = node as Element;
        attrsToRemove.forEach(attr => {
          if (el.hasAttribute(attr)) {
            el.removeAttribute(attr);
          }
        });
      }
    };
    
    // Initial cleanup of the entire document
    document.querySelectorAll(attrsToRemove.map(attr => `[${attr}]`).join(',')).forEach(cleanNode);
    
    // Set up a MutationObserver to watch for future changes
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(cleanNode);
        } else if (mutation.type === 'attributes') {
          cleanNode(mutation.target);
        }
      }
    });

    // Start observing the document body for added nodes and attribute changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: attrsToRemove
    });

    // Disconnect the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
