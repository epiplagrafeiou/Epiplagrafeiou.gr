
'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import TopBar from './TopBar';
import { Providers } from './providers';

export function AppLayout({ children }: { children: React.ReactNode }) {
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
