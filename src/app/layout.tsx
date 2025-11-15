import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import AppLayout from '@/components/layout/AppLayout';
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
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
