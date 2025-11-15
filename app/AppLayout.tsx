
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { Toaster } from "@/components/ui/toaster";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminPage && <TopBar />}
      {!isAdminPage && <Header />}
      <main className={`flex-grow ${isAdminPage ? '' : 'bg-white'}`}>
        {children}
      </main>
      {!isAdminPage && <Footer />}
      <Toaster />
      <NewsletterPopup />
    </div>
  );
}
