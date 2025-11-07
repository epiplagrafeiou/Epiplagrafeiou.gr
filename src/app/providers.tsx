
"use client";

import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/toaster";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import { ReactNode } from "react";
import { SuppliersProvider } from "@/lib/suppliers-context";
import { ProductsProvider } from "@/lib/products-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProductsProvider>
      <CartProvider>
        <SuppliersProvider>
          {children}
          <Toaster />
          <NewsletterPopup />
        </SuppliersProvider>
      </CartProvider>
    </ProductsProvider>
  );
}
