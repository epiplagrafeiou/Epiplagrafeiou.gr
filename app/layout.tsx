
import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/app/client-providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Epiplagrafeiou.gr AI eShop',
  description: 'Your one-stop shop for office furniture, powered by AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
