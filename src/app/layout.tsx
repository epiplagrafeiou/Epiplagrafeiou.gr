
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { Toaster } from "@/components/ui/toaster";
import NewsletterPopup from "@/components/layout/NewsletterPopup";


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
            <div className="flex min-h-screen flex-col">
                <TopBar />
                <Header />
                <main className="flex-grow bg-white">
                    {children}
                </main>
                <Footer />
                <Toaster />
                <NewsletterPopup />
            </div>
        </Providers>
      </body>
    </html>
  );
}
