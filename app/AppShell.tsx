
'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import TopBar from './TopBar';

export default function AppShell({ children }: { children: React.ReactNode }) {
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
    </div>
  );
}
