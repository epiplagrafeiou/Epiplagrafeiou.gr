'use client';

import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SuppliersProvider } from '@/lib/suppliers-context';
import { ProductsProvider } from '@/lib/products-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import { Toaster } from "@/components/ui/toaster";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import { SidebarProvider, SidebarInset, Sidebar } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <FirebaseClientProvider>
      <SuppliersProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
              {isAdminPage ? (
                <SidebarProvider>
                  <Sidebar>
                    <AdminSidebar />
                  </Sidebar>
                  <SidebarInset>{children}</SidebarInset>
                </SidebarProvider>
              ) : (
                <div className="flex min-h-screen flex-col">
                  <TopBar />
                  <Header />
                  <main className="flex-grow bg-white">
                    {children}
                  </main>
                  <Footer />
                  <NewsletterPopup />
                </div>
              )}
              <Toaster />
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </SuppliersProvider>
    </FirebaseClientProvider>
  );
}
