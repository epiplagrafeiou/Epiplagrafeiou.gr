
'use client';

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SuppliersProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
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
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </SuppliersProvider>
    </FirebaseClientProvider>
  );
}
