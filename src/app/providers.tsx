
'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SuppliersProvider } from '@/lib/suppliers-context';
import { ProductsProvider } from '@/lib/products-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SuppliersProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
                {children}
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </SuppliersProvider>
    </FirebaseClientProvider>
  );
}
