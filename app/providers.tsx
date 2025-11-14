
"use client";

import { CartProvider } from "lib/cart-context";
import { Toaster } from "components/ui/toaster";
import NewsletterPopup from "components/layout/NewsletterPopup";
import { ReactNode } from "react";
import { SuppliersProvider } from "lib/suppliers-context";
import { ProductsProvider } from "lib/products-context";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SuppliersProvider>
        <ProductsProvider>
          <CartProvider>
            {children}
            <Toaster />
            <NewsletterPopup />
          </CartProvider>
        </ProductsProvider>
      </SuppliersProvider>
    </FirebaseClientProvider>
  );
}
