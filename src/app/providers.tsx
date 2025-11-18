
'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SuppliersProvider } from '@/lib/suppliers-context';
import { ProductsProvider } from '@/lib/products-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import AppLayout from './AppLayout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SuppliersProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
              <AppLayout>{children}</AppLayout>
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </SuppliersProvider>
    </FirebaseClientProvider>
  );
}
