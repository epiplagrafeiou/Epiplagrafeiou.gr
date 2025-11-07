"use client";

import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/toaster";
import NewsletterPopup from "@/components/layout/NewsletterPopup";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Toaster />
      <NewsletterPopup />
    </CartProvider>
  );
}
