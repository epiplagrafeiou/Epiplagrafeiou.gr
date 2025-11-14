
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/app/Header';
import Footer from '@/app/Footer';
import TopBar from '@/app/TopBar';
import { Providers } from '@/app/providers';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        {!isAdminPage && <TopBar />}
        {!isAdminPage && <Header />}
        <main className={`flex-grow ${isAdminPage ? '' : 'bg-white'}`}>
          {children}
        </main>
        {!isAdminPage && <Footer />}
      </div>
    </Providers>
  );
}
