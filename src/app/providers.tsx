'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SuppliersProvider } from '@/lib/suppliers-context';
import { ProductsProvider } from '@/lib/products-context';
import { CartProvider } from '@/lib/cart-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SuppliersProvider>
        <ProductsProvider>
          <CartProvider>{children}</CartProvider>
        </ProductsProvider>
      </SuppliersProvider>
    </FirebaseClientProvider>
  );
}
