
'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import TopBar from './TopBar';
import { Toaster } from "@/components/ui/toaster";
import NewsletterPopup from "@/components/layout/NewsletterPopup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
