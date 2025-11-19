import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ClientProviders } from './client-providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Epiplagrafeiou.gr AI eShop',
  description: 'Your one-stop shop for office furniture, powered by AI.',
};

// This is the cleanup script that will run before any React hydration.
const cleanupScript = `
  const attrsToRemove = [
    'fdprocessedid',
    'data-avast-orig-ctx',
    'data-avast-is-processed',
    'data-mcafeescript',
    'data-blocked',
  ];

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && attrsToRemove.includes(mutation.attributeName)) {
        mutation.target.removeAttribute(mutation.attributeName);
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // ELEMENT_NODE
             attrsToRemove.forEach(attr => {
              if (node.hasAttribute(attr)) {
                node.removeAttribute(attr);
              }
            });
          }
        });
      }
    }
  });

  // Start observing before the DOM is fully parsed
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: attrsToRemove,
  });
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="dom-cleanup-script" strategy="beforeInteractive">
          {cleanupScript}
        </Script>
      </head>
      <body className={inter.variable}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
